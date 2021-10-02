import * as React from "react"
import * as ReactDOM from "react-dom"
import RenderedApp from './view'

import './style.css'

export enum UserInput {
    TOPLEFT,
    TOPRIGHT,
    TOP,
    LEFT,
    BOTTOMLEFT,
    RIGHT,
    BOTTOM,
    BOTTOMRIGHT
}

class Controls extends React.Component<{ onclk: (arg0: UserInput) => void }> {
    render() {
        return (
            <div className="controls">
                <div className="other">X</div>
                <div className="grid">
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.TOPLEFT)} >↖</div>
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.TOP)}>↑</div>
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.TOPRIGHT)}>↗</div>
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.LEFT)}>←</div>
                    <div className="squarebtn"></div>
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.RIGHT)}>→</div>
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.BOTTOMLEFT)}>↙</div>
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.BOTTOM)}>↓</div>
                    <div className="squarebtn" onClick={() => this.props.onclk(UserInput.BOTTOMRIGHT)}>↘</div>
                </div>
            </div>
        );
    }
}


class SideView extends React.Component<{ handler: any }> {
    render() {
        return (
            <div className="btn" onClick={() => div.requestFullscreen().then(() => this.props.handler()).catch(err => console.log(err))}>
                SideView {'->'}
            </div>
        )
    }
}


class Game extends React.Component {

    queue: Array<UserInput>;

    handler() {
        this.setState({});
    }

    controlClick() {
        let that = this;

        return (what: UserInput) => that.queue.push(what);

    }

    getQueuedEvents() {
        let that = this;
        return () => {
            if (that.queue.length > 0)
                return that.queue.shift();
            else return null;
        };
    }

    constructor(props: any) {
        super(props);
        this.queue = new Array();
    }

    componentDidMount() {
        addEventListener("keydown", this.keydown.bind(this));
        //addEventListener("dblclick", (k) => alert(k));

    }

    keydown(key: KeyboardEvent) {
        switch (key.key) {
            case "w":
                this.queue.push(UserInput.TOP);
                return;
            case "a":
                this.queue.push(UserInput.LEFT);
                return;
            case "s":
                this.queue.push(UserInput.BOTTOM);
                return;
            case "d":
                this.queue.push(UserInput.RIGHT);
                return;
            case "q":
                this.queue.push(UserInput.TOPLEFT);
                return;
            case "r":
                this.queue.push(UserInput.TOPRIGHT);
                return;
            case "z":
                this.queue.push(UserInput.BOTTOMLEFT);
                return;
            case "c":
                this.queue.push(UserInput.BOTTOMRIGHT);
                return;
        }


    }

    render() {
        const dim = { width: Math.min(window.innerWidth - 20, 600), height: 480, events: this.getQueuedEvents() };
        return (
            <div id="game">
                <RenderedApp {...dim} />
                <Controls {...{ onclk: this.controlClick() }} />
                <SideView {...{ handler: this.handler }} />
            </div>
        )
    }
}

let div = document.createElement("div");
div.id = "scene";
document.body.appendChild(div);
ReactDOM.render(<Game />, div);

let elem = document.getElementById("game");

function loop(_delta: any) {

}


