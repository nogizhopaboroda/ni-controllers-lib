import type { EventEmitter } from "events";
import type { Widget } from "./Widget";

export interface ButtonConfig {
  addr: number;
  bitmask: string;
}

export class Button implements Widget {
  readonly name: string;
  readonly addr: number;
  readonly bitmask: number;
  readonly controller: EventEmitter;

  pressed: number;

  constructor(name: string, config: ButtonConfig, controller: EventEmitter) {
    this.name = name;
    this.addr = config.addr;
    this.bitmask = Number.parseInt(config.bitmask, 16);
    this.controller = controller;

    this.pressed = 0;
  }

  parseInput(data: Uint8Array) {
    const isPressed = data[this.addr] & this.bitmask;
    if (this.pressed ^ isPressed) {
      this.pressed = isPressed;
      this.controller.emit(
        `${this.name}:${this.pressed ? "pressed" : "released"}`
      );
    }
  }
}
