import type { EventEmitter } from "events";
import type { Widget } from "./Widget";

export interface StepWheelConfig {
  addr: number;
}

/**
 * Stepwhell is a 4-bit clicky rotary encoder.
 */
export class StepWheel implements Widget {
  readonly name: string;
  readonly addr: number;
  readonly controller: EventEmitter;

  step: number;

  constructor(name: string, config: StepWheelConfig, controller: EventEmitter) {
    this.name = name;
    this.addr = config.addr;
    this.controller = controller;

    this.step = 0;
  }

  parseInput(data: Uint8Array) {
    const newStep = data[this.addr];
    if (newStep == this.step) {
      return;
    }

    if (newStep > this.step) {
      this.controller.emit(`${this.name}:step`, { direction: 1 });
    } else if (newStep < this.step) {
      this.controller.emit(`${this.name}:step`, { direction: -1 });
    }
    this.step = newStep;
  }
}
