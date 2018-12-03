const VENDOR_ID = 0x17cc;
const PRODUCT_ID = 0x1400;

const HID = require('node-hid');

if (process.argv.length < 5) {
  console.error("syntax: OFFSET VALUE FILL");
  return;
}

const OFFSET_ARG = 2;
const VALUE_ARG = 3;
const FILL_ARG = 4;

const offset = parseInt(process.argv[OFFSET_ARG], 10);
const value = parseInt(process.argv[VALUE_ARG], 16);
const fill = parseInt(process.argv[FILL_ARG], 16);

let device;
try {
  device = new HID.HID(VENDOR_ID, PRODUCT_ID);
}
catch(e) {
  console.log(`Could not connect to device:`, e);
}

const FULL_SIZE = 123;

const outPacket = new Array(FULL_SIZE);
for (let i = 0; i < outPacket.length; i++) {
  outPacket[i] = fill;
}
outPacket[0] = 0x80;

console.log('setting', offset, 'to', value, 'parsed from', process.argv[OFFSET_ARG], process.argv[VALUE_ARG]);
outPacket[offset] = value;

//console.log('  packet:', outPacket);
device.write(outPacket);
