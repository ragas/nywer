import * as PIXI from "pixi.js"
import { Viewport } from "pixi-viewport"
//port {Cull} from "pixi-cull"
var Cull = require('pixi-cull');

import * as React from "react"
import { UserInput } from './index'
import TSheet from './tileset.svg'
import StoredMap from './city1.csv'

import * as wasm from "rwasm"

interface Props {
    width: number;
    height: number;
    events: () => UserInput
}

type State = {
    id: number
}

const TILESIZE = 24;
const RESOLUTION =
    (function () {
        const ratio = window.devicePixelRatio;
        for (const r of [4, 3, 2]) {
            if (ratio >= r) {
                return r;
            }
        }
        return 1;
    })();

class RenderedApp extends React.Component<Props, State> {
    app: PIXI.Renderer
    canvas: HTMLDivElement

    width: number
    height: number
    tiletexture: PIXI.BaseTexture
    textures: Map<number, PIXI.Texture>

    chat: wasm.Chat
    redraw: boolean
    spriteCache: Map<PIXI.IPoint, PIXI.Sprite>
    viewport: Viewport
    player: PIXI.Sprite

    data: Array<Array<number>>
    done: boolean
    cull: typeof Cull

    constructor(props: Props) {
        super(props);
        this.width = props.width;
        this.height = props.height;

        this.textures = new Map();

        this.chat = wasm.Chat.make();
        this.redraw = true;
        this.spriteCache = new Map();


        this.viewport = new Viewport({
            screenWidth: this.width,
            screenHeight: this.height,
            worldWidth: 1000,
            worldHeight: 1000,
        });
        this.viewport.scaled = 1;
        this.cull = new Cull.Simple();
        this.done = false;
    }

    componentDidMount() {
        this.app = new PIXI.Renderer({ width: this.width, height: this.height, backgroundColor: 0x000000, resolution: RESOLUTION, autoDensity: true });

        this.canvas.appendChild(this.app.view);

        let resource = new PIXI.SVGResource(TSheet, { scale: RESOLUTION });
        this.tiletexture = new PIXI.BaseTexture(resource);

        let TEXTURESIZE = 32 * RESOLUTION;

        //Textures
        let num = 0;
        for (let x = 0; x < 10; x += 1) {
            for (let y = 0; y < 10; y += 1) {
                let rect = new PIXI.Rectangle(TEXTURESIZE * y, TEXTURESIZE * x, TEXTURESIZE, TEXTURESIZE);
                this.textures[num++] = new PIXI.Texture(this.tiletexture, rect);
            }
        }

        let that = this;
        window.fetch(StoredMap).then(x => x.text()).then(x => {
            let rows = x.split('\n');

            that.data = rows.map(r => r.split(',').map(x => parseInt(x)))
            that.done = true;
        });

        this.player = new PIXI.Sprite(this.textures[0]);
        this.player.width = TILESIZE;
        this.player.height = TILESIZE;
        this.player.tint = 0xAA8877;
        this.player.roundPixels = true;


        this.viewport.clamp({
            left: 0, right: TILESIZE * 100,
            top: 0, bottom: TILESIZE * 100
        });


        this.update();
    }

    forceRedraw(force: boolean) {
        if (this.redraw || force) {
            this.viewport.removeChildren();
            //this.cull.removeChildren();

            for (let x = 0; x < 100; x += 1) {
                for (let y = 0; y < 100; y += 1) {
                    let sprite = new PIXI.Sprite();
                    sprite.x = x * TILESIZE;
                    sprite.y = y * TILESIZE;

                    sprite.width = TILESIZE;
                    sprite.height = TILESIZE;


                    let tiletype = this.data[y][x];//this.chat.get_tiles(x, y);
                    sprite.texture = this.textures[tiletype];

                    this.spriteCache[y * 100 + x] = sprite;
                    this.viewport.addChild(sprite);

                }
            }
            this.cull.addList(this.viewport.children);
            this.viewport.addChild(this.player);
        }

        this.redraw = false;

    }

    processEvents() {
        let eve = this.props.events();
        const n = TILESIZE;
        while (eve != null) {

            switch (eve) {
                case UserInput.BOTTOM:
                    this.player.position.y += n;
                    break;
                case UserInput.BOTTOMLEFT:
                    this.player.position.y += n;
                    this.player.position.x -= n;
                    break;
                case UserInput.BOTTOMRIGHT:
                    this.player.position.y += n;
                    this.player.position.x += n;
                    break;
                case UserInput.LEFT:
                    this.player.position.y += 0;
                    this.player.position.x -= n;
                    break;
                case UserInput.RIGHT:
                    this.player.position.y += 0;
                    this.player.position.x += n;
                    break;
                case UserInput.TOPLEFT:
                    this.player.position.y -= n;
                    this.player.position.x -= n;
                    break;
                case UserInput.TOP:
                    this.player.position.y -= n;
                    this.player.position.x -= 0;
                    break;
                case UserInput.TOPRIGHT:
                    this.player.position.y -= n;
                    this.player.position.x += n;
                    break;

            }

            eve = this.props.events();
        }

    }

    plotLine(x0: number, y0: number, x1: number, y1: number) {
        let res = new Array();
        let dx = Math.abs(x0 - x1);
        let dy = -Math.abs(y0 - y1);

        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;

        let err = dx + dy;
        let e2 = 0;

        let addToRes = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= 100 || y >= 100) return;
            res.push({ x: x, y: y });
        }

        while (true) {

            //res.push({ x: x0, y: y0 });
            addToRes(x0, y0);
            e2 = 2 * err;
            if (e2 >= dy) {
                if (x0 == x1) break;
                err += dy;
                x0 += sx;
            }

            if (e2 <= dx) {
                if (y0 == y1) break;
                err += dx;
                y0 += sy;
            }
        }
        return res;
    }

    plotCircle(x0: number, y0: number, r: number) {
        let res = new Array();
        let x = -r;
        let y = 0;
        let err = 2 - 2 * r;

        let addToRes = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= 100 || y >= 100) return;
            res.push({ x: x, y: y });
        }

        do {

            addToRes(x0 - x, y0 + y);
            addToRes(x0 - y, y0 - x);
            addToRes(x0 + x, y0 - y);
            addToRes(x0 + y, y0 + x);

            r = err;
            if (r <= y) err += ++y * 2 + 1;
            if (r > x || err > y) err += ++x * 2 + 1;

        } while (x < 0);
        return res;
    }


    plotEllipse(xm: number, ym: number, a: number, b: number) {
        let res = new Array();
        let x = -a;
        let y = 0;
        let e2 = b;
        let dx = (1 + 2 * x) * e2 * e2;

        let dy = x * x;
        let err = dx + dy;

        let addToRes = (x: number, y: number) => {
            // if (x < 0 || y < 0 || x >= 100 || y >= 100) return;
            res.push({ x: x, y: y });
        }

        do {
            addToRes(xm - x, ym + y);
            addToRes(xm + x, ym + y);
            addToRes(xm + x, ym - y);
            addToRes(xm - x, ym - y);

            e2 = 2 * err;
            if (e2 >= dx) { x++; err += dx += 2 * b * b; }
            if (e2 <= dy) { y++; err += dy += 2 * a * a; }

        } while (x <= 0);

        while (y++ < b) {
            addToRes(xm, ym + y);
            addToRes(xm, ym - y);
        }

        return res;
    }

    plotSquare(xm: number, ym: number, r: number) {
        let res = new Array();
        let x0 = xm - r;
        let y0 = ym - r;
        let x1 = xm + r;
        let y1 = ym + r;


        let addToRes = (x: number, y: number) => {
            //if (x < 0 || y < 0 || x >= 100 || y >= 100) return;
            res.push({ x: x, y: y });
        }

        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                addToRes(x, y0);
                addToRes(x0, y);
                addToRes(x, y1);
                addToRes(x1, y);
            }
        }
        return res;
    }

    update() {

        this.processEvents();
        if (!this.done) {
            window.requestAnimationFrame(() => this.update());
            return;
        }

        if (this.viewport.dirty) {
            //this.cull.cull(this.viewport.getVisibleBounds());
            this.viewport.dirty = false;
        }

        this.forceRedraw(false);

        for (let x = 0; x < 100; x += 1) {
            for (let y = 0; y < 100; y += 1) {
                let sprite = this.spriteCache[y * 100 + x];
                let tiletype = this.data[y][x];//this.chat.get_tiles(x, y);
                sprite.texture = this.textures[tiletype];
                sprite.tint = 0x333333;
            }
        }


        // for (let t of this.plotSquare(this.player.x / 32, this.player.y / 32, 6)) {

        //     for (let l of this.plotLine(this.player.x / 32, this.player.y / 32, t.x, t.y)) {
        //         //this.spriteCache[l.y * 100 + l.x].texture = this.textures[0];
        //         if (this.spriteCache[l.y * 100 + l.x] === undefined) {
        //             // console.log(l.y, l.x);
        //         } else
        //             this.spriteCache[l.y * 100 + l.x].tint = 0xffffff;
        //     }
        // }


        for (let t of this.plotEllipse(this.player.x / TILESIZE, this.player.y / TILESIZE, 6, 6)) {

            for (let l of this.plotLine(this.player.x / TILESIZE, this.player.y / TILESIZE, t.x, t.y)) {
                //this.spriteCache[l.y * 100 + l.x].texture = this.textures[0];
                if (this.spriteCache[l.y * 100 + l.x] === undefined) {
                    // console.log(l.y, l.x);
                } else
                    this.spriteCache[l.y * 100 + l.x].tint = 0xffffff;
            }
        }
        this.viewport.moveCenter(this.player.position);
        this.app.render(this.viewport);


        window.requestAnimationFrame(() => this.update());
    }
    render() {
        let component = this;
        return (
            <div ref={(e) => { component.canvas = e }}> </div>
        )
    }
}

export default RenderedApp;
