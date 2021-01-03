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
  imageDataLength = 256;
  sequences = 4;

  constructor(
    readonly config: ScreenConfig,
    readonly write: (packets: Uint8Array[]) => void
  ) {}

  getHeader(sequence){
    return [0xe0, 0, 0, sequence * 2, 0, 0x80, 0, 0x02, 0];
  }

  paintScreen(data = []){
    const imageDataLength = this.imageDataLength;
    const length = this.config.length;
    const packets = [];
    for(let i = 0; i < this.sequences; i++){
      const packet = new Uint8Array(length);
      const header = this.getHeader(i);
      packet.set(header, 0);
      const offset = i * imageDataLength;
      const slice = data.slice(offset, offset + imageDataLength);
      packet.set(slice, header.length);
      packets[i] = packet;
    };
    this.write(packets);
  }

  async clearScreen(){
    return this.paintScreen([]);
  }
}
