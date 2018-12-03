
const VENDOR_ID = 0x17cc;
const PRODUCT_ID = 0x1400;

const HID = require('node-hid');

let device;
try {
  device = new HID.HID(VENDOR_ID, PRODUCT_ID);
}
catch(e) {
  console.log(`Could not connect to device:`, e);
}

let lastDataGroup = [null, null, null];
device.on("data", (data) => {
  const group = data[0];
  const lastData = lastDataGroup[group];

  if (lastData === null) {
    lastDataGroup[group] = data;
    console.log('initial packet size:', data.length, 'for group', group);
    return;
  }

  if (lastData.length !== data.length) {
    console.warn('data size changed from', lastData.length, 'to', data.length);
  }

  for (let i = 0; i < data.length; i++) {
    // For group 1, bytes 11 and 12 seem to be a checksum or something weird.
    if (group === 1 && (i === 11 || i === 12)) {
      continue;
    }

    if (data.length > lastData.length && i >= lastData.length) {
      const d = data[i];
      console.log(`new byte ${i.toString().padStart(2, ' ')}: ${d.toString().padStart(3, ' ')} [${d.toString(16).padStart(2, '0')}] ${d.toString(2).padStart(8, '0') }`);
    } else if (lastData[i] !== data[i]) {
      const p = lastData[i];
      const d = data[i];
      console.log(`group ${group} byte ${i.toString().padStart(2, ' ')}: ${p.toString().padStart(3, ' ')} [${p.toString(16).padStart(2, '0')}] ${p.toString(2).padStart(8, '0')}  =>  ${d.toString().padStart(3, ' ')} [${d.toString(16).padStart(2, '0')}] ${d.toString(2).padStart(8, '0') }`);
    }
  }
  lastDataGroup[group] = data;
});
device.on("error", (ex) => {
  console.log("device error:", ex);
});
