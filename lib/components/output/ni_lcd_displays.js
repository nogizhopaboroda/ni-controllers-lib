/*
 * Handles Native Instrument LCD display protocol as used by the Traktor D2 and
 * Maschine Mk3.  May be further generalized in the future.
 *
 * Note that this isn't an HID protocol so we use 'usb' instead of 'node-hid'
 */

const usb = require('usb');

const HEADER_LENGTH = 16;
function fillHeader(buf, displayNum, x, y, width, height) {
  const view = new DataView(buf);
  view.setUint8(0, 0x84);
  // 0x2 is 0
  view.setUint8(2, displayNum);
  view.setUint8(3, 0x60);
  // last 4 bytes are 0x0 too.

  view.setUint16(8, x);
  view.setUint16(10, y);
  view.setUint16(12, width);
  view.setUint16(14, height);
}

const COMMAND_LENGTH = 4;
const PIXEL_LENGTH = 2;

function fillTransmitCommand(buf, numPixels, off=HEADER_LENGTH) {
  const halfPixels = numPixels / 2;

  const view = new DataView(buf, off);
  // We want a big endian 24-bit value, so write it 32-bit then clobber the MSB
  // with the command.
  view.setUint32(0, halfPixels);
  view.setUint8(0, 0);
}

class LCDDisplays {
  constructor({ vendorId, productId, displayConfig }) {
    const device = this.device = usb.findByIds(vendorId, productId);
    device.open();
    const iface = this.iface = device.interface(displayConfig.interface);
    iface.claim();

    this.displaysEndpoint = iface.endpoint(displayConfig.endpoint);
    this.numDisplays = displayConfig.numDisplays;

    this.width = displayConfig.eachWidth;
    this.height = displayConfig.eachHeight;
  }

  /**
   * Given an existing ArrayBuffer that contains data to display, blit it to the
   * given display.
   */
  async paintDisplay(displayNum, pixelBuffer) {
    const width = this.width;
    const height = this.height;
    const numPixels = width * height;

    const buf = new ArrayBuffer(
      HEADER_LENGTH + COMMAND_LENGTH * 3 + numPixels * PIXEL_LENGTH);
    const allData = new Uint8Array(buf);

    fillHeader(buf, displayNum, 0, 0, width, height);
    fillTransmitCommand(buf, numPixels);

    const dataStart = HEADER_LENGTH + COMMAND_LENGTH;
    const dataStop = dataStart + numPixels * PIXEL_LENGTH;

    // Create a Uint8Array on the underlying buffer.
    const pixelRow = new Uint8Array(pixelBuffer,
                                    0,
                                    numPixels * PIXEL_LENGTH);

    allData.set(pixelRow, dataStart);
    // the blit command
    allData[dataStop] = 0x03;
    // the end command
    allData[dataStop + COMMAND_LENGTH] = 0x40;

    await new Promise((resolve) => {
      //console.log(Array.from(allData).map(x => x.toString(16)).join(','));
      this.displaysEndpoint.transfer(allData, resolve);
    });
  }

  /**
   * Given a JS array where each entry is a 16-bit number representing 2-bytes
   * worth of pixel data, blit it to the given display.
   *
   * TODO: We can just permute the `paintDisplay` implementation to reduce
   * copies since we only expect this variant to be used.  Although we may also
   * implement some dumb home-brew RLE-compression, so maybe wait for that.
   * (ex: negative value is a run-length for the following pixels).
   */
  paintDisplayFromArray(displayNum, array) {
    const u16arr = Uint16Array.from(array);
    return this.paintDisplay(displayNum, u16arr.buffer);
  }
}

module.exports = LCDDisplays;
