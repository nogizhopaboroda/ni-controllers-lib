import tinycolor from "tinycolor2";

const colorTable = [
  "#fe0000",
  "#fe1800",
  "#fe6000",
  "#fe9400", // in hue space this would just be yellow
  "#fedc00", // in hue space this would be lime
  "#4cfe00", // in hue space this would be green
  "#00fe00", // in hue space this would be mint
  "#00fe40", // in hue space this would be a greenish-cyan
  "#00fef0",
  "#0078fe",
  "#0000fe",
  "#4c00fe",
  "#ac00fe",
  "#fe007c",
  "#fe003c",
  "#fe0014",
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
