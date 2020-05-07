import type { EventEmitter } from "events";
import type { Widget } from "./Widget";

interface SliderConfig {
  msb: number;
  lsb: number;
}

/**
 * 12-bit absolution position for fixed knob potentiometers and sliders.
 *
 * Also currently used for infinite rotary encoders, but that obviously needs
 * roll-over support or some relative anchoring mechanism.  And really wants to
 * be its own type.
 */
export class Slider implements Widget {
  readonly name: string;
  readonly msb: number;
  readonly lsb: number;
  readonly controller: EventEmitter;

  _position: number;
  value: number;

  constructor(name: string, config: SliderConfig, controller: EventEmitter) {
    this.name = name;
    this.msb = config.msb;
    this.lsb = config.lsb;
    this.controller = controller;

    this._position = 0;
    this.value = 0;
  }

  parseInput(data: Uint8Array) {
    const newPos = data[this.lsb] + (data[this.msb] << 8);

    if (newPos != this._position) {
      this._position = newPos;
      if (this._position < 10) {
        this.value = 0;
      } else if (this._position >= 4080) {
        this.value = 1;
      } else {
        this.value = this._position / 4096;
      }
      this.controller.emit(`${this.name}:changed`, { value: this.value });
    }
  }
}
