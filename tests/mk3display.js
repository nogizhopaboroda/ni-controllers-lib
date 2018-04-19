/*
   This attempts to display stuff on the maschine mk3 display using the 'usb'
   module.  This is not an HID endpoint so we can't use node-hid.
 */


const VENDOR_ID = 0x17cc;
const PRODUCT_ID = 0x1600;


const usb = require('usb');

const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);
device.open();
const iface = device.interface(5);
iface.claim();

const display = iface.endpoint(4);
display.on('error', function(err) {
  console.log('endpoint error:', err);
});

function msb(v) {
  return (v >> 8) & 0xff;
}
function lsb(v) {
  return v & 0xff;
}

function rg(red, green) {
  return (red & 0x1f) << 3 | ((green & 0x3f) >> 3);
}
function gb(green, blue) {
  return ((green & 0x3f) << 5) | (blue & 0x1f);
}

function rgb16(red, green, blue) {
  return ((red & 0x1f) << 11) |
         ((green & 0x3f) << 5) |
         (blue & 0x1f);
}

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
function fillTransmitCommand(buf, numPixels, off=HEADER_LENGTH) {
  const halfPixels = numPixels / 2;

  const view = new DataView(buf, off);
  // We want a big endian 24-bit value, so write it 32-bit then clobber the MSB
  // with the command.
  view.setUint32(0, halfPixels);
  view.setUint8(0, 0);
}

function makeAndFillBuffer(width, height) {
  const numPixels = width * height;
  const buf = new ArrayBuffer(numPixels * PIXEL_LENGTH);

  let x = 0, y = 0;
  const pixels = new Uint16Array(buf);
  for (let i = 0; i < numPixels; i++) {
    let red = x % 32;
    let green = y % 64;
    let blue = Math.floor(x / 32) % 32;

    const pix = rgb16(red, green, blue);
    //console.log(x, y, pix);
    pixels[i] = pix;
    x++;
    if (x >= width) {
      x = 0;
      y++;
    }
  }

  return buf;
}

const EACH_WIDTH = 480;
const EACH_HEIGHT = 272;
const PIXEL_LENGTH = 2;
/**
 * Paint the display by sending one packet per row.
 */
async function paintDisplay(displayNum, pixelBuffer) {
  const width = EACH_WIDTH;
  const height = 1; //EACH_HEIGHT;
  const numPixels = width * height;

  const buf = new ArrayBuffer(
    HEADER_LENGTH + COMMAND_LENGTH * 3 + numPixels * PIXEL_LENGTH);
  const allData = new Uint8Array(buf);

  for (let row = 0; row < EACH_HEIGHT; row++) {
    fillHeader(buf, displayNum, 0, row, width, height);
    fillTransmitCommand(buf, numPixels);
    const dataStart = HEADER_LENGTH + COMMAND_LENGTH;
    const dataStop = dataStart + numPixels * PIXEL_LENGTH;

    const pixelRow = new Uint8Array(pixelBuffer,
                                    row * EACH_WIDTH * PIXEL_LENGTH,
                                    EACH_WIDTH * PIXEL_LENGTH);
    allData.set(pixelRow, dataStart);
    // the blit command
    allData[dataStop] = 0x03;
    // the end command
    allData[dataStop + COMMAND_LENGTH] = 0x40;

    await new Promise((resolve) => {
      //console.log(Array.from(allData).map(x => x.toString(16)).join(','));
      display.transfer(allData, resolve);
    });
  }
}

async function main() {
  const pixels = makeAndFillBuffer(EACH_WIDTH, EACH_HEIGHT);

  console.log('painting display 0');
  let rval1 = await paintDisplay(0, pixels);
  console.log('painting display 1');
  let rval2 = await paintDisplay(1, pixels);
  console.log('all painted', rval1, rval2);
}

//console.log(device, iface, display);
main();