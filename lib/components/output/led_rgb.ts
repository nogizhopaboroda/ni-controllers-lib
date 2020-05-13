import tinycolor from "tinycolor2";

export interface LedRgbConfig {
  bAddr: number;
  gAddr: number;
  rAddr: number;
}

export class LED_RGB {
  r = 0;
  g = 0;
  b = 0;

  constructor(
    readonly config: LedRgbConfig,
    readonly outPacket: Uint8Array,
    readonly invalidateOutput: () => void
  ) {}

  updateOutputPacket() {
    this.outPacket[this.config.rAddr] = Math.floor(this.r / 2);
    this.outPacket[this.config.gAddr] = Math.floor(this.g / 2);
    this.outPacket[this.config.bAddr] = Math.floor(this.b / 2);
    this.invalidateOutput();
  }

  setRGB(newR: number, newG: number, newB: number) {
    this.r = newR;
    this.g = newG;
    this.b = newB;
    this.updateOutputPacket();
  }

  setHSV(h: number, s: number, v: number) {
    const color = tinycolor({ h, s, v }).toRgb();
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
    this.updateOutputPacket();
  }
}
