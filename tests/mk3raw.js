const HID = require('node-hid');

const VENDOR_ID = 0x17cc;
const PRODUCT_ID = 0x1600;

const device = new HID.HID(VENDOR_ID, PRODUCT_ID);
device.on("error",  (ex) => {
  console.log("device error:", ex);
});

const pkt = new Array(42);
pkt[0] = 0x81;
// Touch slider mini-dot LEDs which don't seem to support the "white" values.
for (let i = 1; i < 26; i++) {
  pkt[i] = i + 3;
  //pkt[i] = i + 3 + 26;
}
// Drum pads.
for (let i = 26; i < 42; i++) {
  pkt[i] = (i-26 + 1) * 4 + 2;
  //pkt[i] = (i-25) + 3 + 32;
}

device.write(pkt);

const pkt2 = new Array(63);
pkt2[0] = 0x80;
// All buttons
for (let i = 1; i < pkt2.length; i++) {
  pkt2[i] = 63;
}
// Group pads.
for (let i = 30; i <= 37; i++) {
  // whites
  pkt2[i] = i%4 + 68;
  // show contiguous colors with an offset.
  pkt2[i] = i-30 + 4 + 12;
}
// Directional encoder dots
for (let i = 59; i <= 62; i++) {
  pkt2[i] = i%4 + 4;
}
pkt2[6] = 68;
device.write(pkt2);
