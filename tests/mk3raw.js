const HID = require('node-hid');

const VENDOR_ID = 0x17cc;
const PRODUCT_ID = 0x1600;

const device = new HID.HID(VENDOR_ID, PRODUCT_ID);
device.on("error",  (ex) => {
  console.log("device error:", ex);
});

const pkt = new Array(42);
// Pads, sliders
pkt[0] = 0x81;
for (let i = 1; i < 26; i++) {
  pkt[i] = i + 3;
}
for (let i = 26; i < 42; i++) {
  pkt[i] = (i-25) * 4 + 2;
}

device.write(pkt);

const pkt2 = new Array(63);
pkt2[0] = 0x80;
for (let i = 1; i < pkt2.length; i++) {
  pkt2[i] = 63;
}
device.write(pkt2);
