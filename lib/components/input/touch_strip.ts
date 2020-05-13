import type { EventEmitter } from "events";
import type { Widget } from "./Widget";

export interface TouchStripConfig {
  dataMsb: number;
  timeMsb: number;
  dataLsb: number;
  timeLsb: number;
}

/**
 * 32 bits of touch-strip data somehow.
 */
export class TouchStrip implements Widget {
  readonly name: string;
  readonly config: TouchStripConfig;
  readonly controller: EventEmitter;

  _position: number;
  value: number;

  constructor(
    name: string,
    config: TouchStripConfig,
    controller: EventEmitter
  ) {
    this.name = name;
    this.config = config;
    this.controller = controller;

    this._position = 0;
    this.value = 0;
  }

  parseInput(data: Uint8Array) {
    // So, this really isn't a timestamp.
    let timestamp =
      data[this.config.timeLsb] + (data[this.config.timeMsb] << 8);
    let newVal = data[this.config.dataLsb] + (data[this.config.dataMsb] << 8);

    if (newVal != this._position) {
      this._position = newVal;

      this.value = newVal / 1024;
      this.controller.emit(`${this.name}:changed`, {
        value: this.value,
        timestamp,
      });
    }
  }
}
