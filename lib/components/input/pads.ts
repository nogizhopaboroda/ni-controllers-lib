import type { EventEmitter } from "events";
import { Widget } from "./Widget";

const PRESS_THRESHOLD = 256;

export interface PadsConfig {
  dataSize: number;
  start: string;
  repeated: number;
  length: number;
  padCount: number;
  prefix: string;
}

/**
 * This handles the Maschine mk3 pad pressure messages.  I started out trying to
 * make this generic, then gave up.  The JSON is now designed to just give a
 * general idea of what's going on.
 *
 * The USB packet starts with 0x02 and contains potentially up to 21 sub-packets
 * of 3 byte tuples.  The bytes are:
 * [ 1 byte: pad index] [ 4 bits: weird, 4 bits: MSB nibble ] [ 1 byte: LSB ]
 *
 * The packets are delta-packets.  They are only generated when there is a
 * change and they are only generated for pads for which there has been a
 * change.  There will always be at least one entry.  There will always be a
 * sentinel all-zero entry after the last meaningful entry.  Anything beyond
 * that entry is previous buffer state and should be ignored; the mk3 does not
 * clear the memory.  A pad cannot be listed twice in one packet.
 *
 * I'm not sure what's up with the "weird" nibble.  It usually has the value 4,
 * but in the 2nd-to-last packet in a release it may have the value 2 or 3 when
 * the reported pressure is 0.  But then it gets followed by another packet
 * where the value is 4 again with the pressure still being 0.
 *
 * Because of the above rules, if a 0 index is observed in the first packet, it
 * is always going to be an actual pad pressure.  A 0 index in any other slot
 * serves as an end-of-packet indicator (because of sorting), although if we
 * treat that weird nibble as a validity indicator, we can also consult that.
 *
 * NOTE: I've experimentally added events for just the prefix that carry the
 * index as the first payload.  The idea is that it's dumb to manually have to
 * re-constitute the group relationship downstream.  But the F1 grid needs to
 * get some support for that, then.  (Maybe just some type of filter predicate
 * that tells the button the broadcast logic?  Or just a separate listener that
 * auto-listens to each button?)
 */
export class Pads implements Widget {
  readonly startOffset: number;
  readonly dataSize: number;
  readonly repeatCount: number;
  readonly eachLength: number;
  readonly padCount: number;
  readonly prefix: string;
  readonly controller: EventEmitter;
  readonly state: Array<number>;

  constructor(
    config: PadsConfig,
    controller: EventEmitter,
    normInt: (str: string | number) => number
  ) {
    this.startOffset = normInt(config.start);
    this.dataSize = normInt(config.dataSize);
    this.repeatCount = normInt(config.repeated);
    this.eachLength = normInt(config.length);
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
