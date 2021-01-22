import tinycolor from "tinycolor2";

const colorTable = [
  "#fe0000",
  "#fe1800",
  "#fe6000",
  "#fe9400",
  "#fedc00",
  "#4cfe00",
  "#00fe00",
  "#00fe40",
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

  setWhiteBrightness(brightness: number = 0) {
    const color = tinycolor({ r: this.r, g: this.g, b: this.b });
    const { r, g, b } = color.brighten(brightness).toRgb();
    this.setRGB(r, g, b);
  }

  setColorByNumberHelper(color16: number, ...args: any[]) {
    this.setColorHelper(colorTable[color16], ...args);
  }

  /*
   * @param brightness The amount to brighten by. The valid range is 0 to 100.
   * Due to tinycolor api, dividing it by 100
   * */
  setColorHelper(colorString: string, brightness: number = 0) {
    const color = tinycolor(colorString);
    const { r, g, b } = color.brighten(brightness / 100).toRgb();
    this.setRGB(r, g, b);
  }
}
