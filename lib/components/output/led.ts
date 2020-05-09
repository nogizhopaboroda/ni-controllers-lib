export interface LedConfig {
  addr: number;
}

/**
 * Mono-colored LED with a value between 0 and whatever brightestValue is, which
 * is set on a device level.  The Traktor Kontrol F1 uses a brightestValue of
 * 127 and the Maschine Mk3 uses a brightest value of 63.
 */
export class LED {
  brightness = 0;

  constructor(
    readonly config: LedConfig,
    readonly brightestValue: number,
    readonly outPacket: Uint8Array,
    readonly invalidateOutput: () => void
  ) {}

  updateOutputPacket() {
    this.outPacket[this.config.addr] = Math.floor(
      this.brightness * this.brightestValue
    );
    this.invalidateOutput();
  }

  /* 0 to 1.0 scale */
  setBrightness(newBrightness: number) {
    this.brightness = newBrightness;
    this.updateOutputPacket();
  }

  setOn() {
    this.brightness = 1;
    this.updateOutputPacket();
  }

  setOff() {
    this.brightness = 0;
    this.updateOutputPacket();
  }

  setBool(val: boolean) {
    this.brightness = val ? 1 : 0;
    this.updateOutputPacket();
  }
}
