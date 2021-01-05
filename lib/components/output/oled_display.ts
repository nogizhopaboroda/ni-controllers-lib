export interface OLEDDisplayConfig {
  length: number;
  firstByte: number;
  width: number;
  height: number;
}

type Black = 0x00;
type White = 0x01 | 0xff;
type Color = Black | White;
type Pixel = [number, number, Color];

export class OLEDDisplay {
  imageDataLength = 256;
  packetPerScreen = 4;
  state: Array<number> = [];

  constructor(
    readonly config: OLEDDisplayConfig,
    readonly invalidateOutput: (packets: Uint8Array[]) => void
  ) {}

  getHeader(packetIndex: number): number[] {
    /* [ firstByte, 0x00, 0x00, 0x0<packetIndex>, 0, 0x80, 0x00, 0x02, 0x00 ] */
    return [this.config.firstByte, 0, 0, packetIndex * 2, 0, 128, 0, 2, 0];
  }

  // taken from https://github.com/noopkat/oled-js/blob/master/oled.ts#L554-L556
  private isSinglePixel(pixels: Pixel | Pixel[]): pixels is Pixel {
    return typeof pixels[0] !== "object";
  }

  // taken from https://github.com/noopkat/oled-js/blob/master/oled.ts#L559-L600
  drawPixel(pixels: Pixel | Pixel[], sync: boolean = false): void {
    if (this.isSinglePixel(pixels)) pixels = [pixels];

    const { width, height } = this.config;

    pixels.forEach((el: Pixel) => {
      // return if the pixel is out of range
      const [x, y, color] = el;

      if (x > width || y > height) return;
      let byte = 0;

      const page = Math.floor(y / 8);
      const pageShift = 0x01 << (y - 8 * page);

      // is the pixel on the first row of the page?
      page === 0 ? (byte = x) : (byte = x + width * page);

      // colors! Well, monochrome.
      if (color === 0) {
        // BLACK pixel
        this.state[byte] &= ~pageShift;
      } else {
        // WHITE pixel
        this.state[byte] |= pageShift;
      }
    });

    if (sync) {
      this.paintScreen();
    }
  }

  // taken from https://github.com/noopkat/oled-js/blob/master/oled.ts#L539-L552
  drawBitmap(pixels: Array<Color>, sync: boolean = true): void {
    const { width } = this.config;

    for (let i = 0; i < pixels.length; i++) {
      const x = Math.floor(i % width);
      const y = Math.floor(i / width);

      this.drawPixel([x, y, pixels[i]], false);
    }

    if (sync) {
      this.paintScreen();
    }
  }

  drawImage(
    image: ImageData,
    inverted: boolean = false,
    sync: boolean = true
  ): void {
    if (
      image.width !== this.config.width ||
      image.height !== this.config.height
    ) {
      throw new Error(
        `image is not ${this.config.width}x${this.config.height}`
      );
    }

    const bitmap: Array<Color> = [];
    const pixels = image.data;
    const pixelsLen = pixels.length;
    const depth = this.packetPerScreen;
    const threshold = 120;

    // filtering logic is taken from https://github.com/noopkat/png-to-lcd/blob/master/png-to-lcd.js#L57-L71
    for (let i = 0; i < pixelsLen; i += depth) {
      // just take the red value
      let pixelVal = (pixels[i + 1] = pixels[i + 2] = pixels[i]);

      // do threshold for determining on and off pixel vals
      if (pixelVal > threshold) {
        pixelVal = 1;
      } else {
        pixelVal = 0;
      }

      bitmap[i / depth] = (inverted ? 1 - pixelVal : pixelVal) as Color;
    }
    this.drawBitmap(bitmap, sync);
  }

  paintScreen(data: Array<number> = this.state) {
    this.state = data;
    const imageDataLength = this.imageDataLength;
    const length = this.config.length;
    const packets = [];
    for (
      let packetIndex = 0;
      packetIndex < this.packetPerScreen;
      packetIndex++
    ) {
      const packet = new Uint8Array(length);
      const header = this.getHeader(packetIndex);
      packet.set(header, 0);

      const offset = packetIndex * imageDataLength;
      const slice = data.slice(offset, offset + imageDataLength);
      packet.set(slice, header.length);

      packets[packetIndex] = packet;
    }
    this.invalidateOutput(packets);
  }

  clearScreen() {
    return this.paintScreen([]);
  }
}
