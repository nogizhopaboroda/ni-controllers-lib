export interface OLEDDisplayConfig {
  length: number;
  firstByte: number;
}

export class OLEDDisplay {
  imageDataLength = 256;
  packetPerScreen = 4;

  constructor(
    readonly config: OLEDDisplayConfig,
    readonly invalidateOutput: (packets: Uint8Array[]) => void
  ) {}

  getHeader(packetIndex: number): number[] {
    /* [ firstByte, 0x00, 0x00, 0x0<packetIndex>, 0, 0x80, 0x00, 0x02, 0x00 ] */
    return [this.config.firstByte, 0, 0, packetIndex * 2, 0, 128, 0, 2, 0];
  }

  paintScreen(data: number[] = []){
    const imageDataLength = this.imageDataLength;
    const length = this.config.length;
    const packets = [];
    for(let packetIndex = 0; packetIndex < this.packetPerScreen; packetIndex++){
      const packet = new Uint8Array(length);
      const header = this.getHeader(packetIndex);
      packet.set(header, 0);

      const offset = packetIndex * imageDataLength;
      const slice = data.slice(offset, offset + imageDataLength);
      packet.set(slice, header.length);

      packets[packetIndex] = packet;
    };
    this.invalidateOutput(packets);
  }

  clearScreen(){
    return this.paintScreen();
  }
}
