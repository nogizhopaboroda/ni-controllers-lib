import type { EventEmitter } from "events";
import { Widget } from "./Widget";

const PRESS_THRESHOLD = 256;

export interface PadsConfig {
  dataSize: number;
  padCount: number;
  prefix: string;
}

export class Pads implements Widget {
  readonly dataSize: number;
  readonly padCount: number;
  readonly prefix: string;
  readonly controller: EventEmitter;
  readonly state: Array<number>;

  constructor(
    config: PadsConfig,
    controller: EventEmitter,
    normInt: (str: string | number) => number
  ) {
    this.dataSize = normInt(config.dataSize);
    this.padCount = normInt(config.padCount);
    this.prefix = config.prefix;
    this.controller = controller;
    this.state = new Array(this.padCount).fill(0);
  }

  parseInput(data: Uint8Array) {

    for (let i = 1; i <= this.dataSize; i += 2)
    {
      const l = data[i];
      const h = data[i + 1];
      const index = (h & 0xf0) >> 4;
      const pressure = (((h & 0x0f) << 8) | l);

      const name = this.prefix + (index + 1);
      if (pressure <= PRESS_THRESHOLD) {
        const wasPressed = this.state[index] > PRESS_THRESHOLD;
        this.state[index] = 0;

        if (wasPressed) {
          this.controller.emit(`${name}:released`, 0);
          this.controller.emit(`${this.prefix}:released`, index, 0);
        }
      } else {
        const firstPress = this.state[index] <= PRESS_THRESHOLD;
        this.state[index] = pressure;

        if (firstPress) {
          this.controller.emit(`${name}:pressed`, pressure);
          this.controller.emit(`${this.prefix}:pressed`, index, pressure);
        }

        this.controller.emit(`${name}:pressure`, pressure);
        this.controller.emit(`${this.prefix}:pressure`, index, pressure);
      }

    }
  }
}
