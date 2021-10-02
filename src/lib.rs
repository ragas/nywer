mod wasmutils;
use enum_map::*;
use js_sys::Array;
use rand::prelude::*;
use rand::seq::SliceRandom;
use wasm_bindgen::prelude::*;
extern crate nalgebra_glm as glm;

pub struct Info {
  temp: i32,
  wind: i32,
  time: i32,
  light: i32,
}

pub struct Tile {
  pos: (i32, i32, i32),
}

#[wasm_bindgen]
pub struct Point {
  x: i32,
  y: i32,
}

#[wasm_bindgen]
pub struct Chat {
  map: Vec<i32>,
  //  info: Info,
}

#[wasm_bindgen]
impl Chat {
  pub fn make() -> Self {
    wasmutils::set_panic_hook();
    let mut chat = Chat {
      map: vec![1; 128 * 128],
    };

    let mut i = 0;
    chat.map.iter_mut().for_each(|t| {
      *t = 14
      //i += 1
    });

    chat
  }

  pub fn get_tiles(&self, x: i32, y: i32) -> i32 {
    self.map[(y * 32 + x) as usize]
  }

  pub fn get_string(&self) -> String {
    "a simple stuff".to_string()
  }
}
