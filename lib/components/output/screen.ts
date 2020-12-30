export interface ScreenConfig {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  dp: number;
}

export class Screen {
  char = " ";
  dotBrightness = 0;
  brightness = 1;
  segmentBits = 0x00;

  constructor(
    readonly config: ScreenConfig,
    readonly outPacket: Uint8Array,
    readonly invalidateOutput: () => void
  ) {}

  updateOutputPacket() {
    const value = Math.floor(this.brightness * 127);
    this.outPacket[this.config.a] = this.segmentBits & 0x01 ? value : 0;
    this.outPacket[this.config.b] = this.segmentBits & 0x02 ? value : 0;
    this.outPacket[this.config.c] = this.segmentBits & 0x04 ? value : 0;
    this.outPacket[this.config.d] = this.segmentBits & 0x08 ? value : 0;
    this.outPacket[this.config.e] = this.segmentBits & 0x10 ? value : 0;
    this.outPacket[this.config.f] = this.segmentBits & 0x20 ? value : 0;
    this.outPacket[this.config.g] = this.segmentBits & 0x40 ? value : 0;
    this.outPacket[this.config.dp] = Math.floor(this.dotBrightness * 127);
    this.invalidateOutput();
  }

  setChar(newChar: string) {
    if (newChar.length != 1) return;

    if (!Number.isNaN(Number.parseInt(newChar))) {
      this.char = `d${newChar}`;
    } else {
      this.char = newChar.toLowerCase();
    }

    if (this.char in LCDchars) {
      this.segmentBits = Number.parseInt(
        LCDchars[this.char as keyof typeof LCDchars],
        16
      );
      this.updateOutputPacket();
    }
  }

  setDot(newDotBrightness: number) {
    if (newDotBrightness != this.dotBrightness) {
      this.dotBrightness = newDotBrightness;
      this.updateOutputPacket();
    }
  }

  setBrightness(newBrightness: number) {
    if (newBrightness != this.brightness) {
      this.brightness = newBrightness;
      this.updateOutputPacket();
    }
  }

  getHeader(sequence){
    return [0xe0, 0, 0, sequence * 2, 0, 0x80, 0, 0x02, 0];
  }

  async paingScreen(data = []){
    for(let j = 0; j < this.config.sequences; j++){
      const offset = j * 256;
      const header = this.getHeader(j);
      const slice = data.slice(offset, offset + 256);
      debugger;
      this.outPacket.set(header, 0);
      this.outPacket.set(slice, header.length);
      await this.invalidateOutput();
    };
  }

  async clearScreen(){
    // console.log(11111, this.config);
    return this.paingScreen();
  }
}
