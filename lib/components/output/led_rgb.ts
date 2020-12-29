import tinycolor from "tinycolor2";

const colorTable = [
  "red",
  "orangered",
  "darkorange",
  "yellow", // in hue space this would just be yellow
  "lime", // in hue space this would be lime
  "green", // in hue space this would be green
  "springgreen", // in hue space this would be mint
  "aquamarine", // in hue space this would be a greenish-cyan
  "cyan",
  "turquoise",
  "blue",
  "plum",
  "violet",
  "purple",
  "magenta",
  "fuchsia",
];

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


  setWhiteBrightness(f: number) {
    const color = tinycolor({ r: this.r, g: this.g, b: this.b });
    const { r, g, b } = color.brighten(f).toRgb();
    this.setRGB(r, g, b);
  }

  setColorByNumberHelper(color16: number){
    this.setColorHelper(colorTable[color16]);
  }

  setColorHelper(colorString: string){
    const color = tinycolor(colorString);
    const { r, g, b } = color.toRgb();
    this.setRGB(r, g, b);
  }
}
