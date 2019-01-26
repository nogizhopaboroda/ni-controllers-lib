'use strict';

const HID = require('node-hid');
const util = require('util');

const EventEmitter = require('events').EventEmitter;

const Button = require('./components/input/button');
const PacketizedPads = require('./components/input/packetized_pads');
const StepWheel = require('./components/input/stepwheel');
const Slider = require('./components/input/slider');


const LED = require('./components/output/led');
const LED_RGB = require('./components/output/led_rgb');
const LED_Indexed = require('./components/output/led_indexed');
const LCDDigit = require('./components/output/lcd_digit');
const LCDDisplays = require('./components/output/ni_lcd_displays');


function normInt(val) {
  const vtype = typeof(val);
  if (vtype === "string") {
    if (val.startsWith("0x")) {
      // parseInt does assume this itself if we leave the radix unspecified,
      // but it's bad form to not specify a radix for parsing and we might want
      // to throw because we really do want all string numbers to be base-16
      // and such.
      return parseInt(val, 16);
    } else {
      console.warn("weirdly formatted string, using radix 10:", val);
      return parseInt(val, 10);
    }
  } else if (vtype === "number") {
    return val;
  } else {
    throw new Error(`somehow not a number: "${val}"`);
  }
}

class BaseController extends EventEmitter {
  constructor(config) {
    super();

    const vendorId = normInt(config.vendorId);
    const productId = normInt(config.productId);
    const controllerName = config.name;

    var dirty = false;

    this.device = null;

    this.buttons = {};
    this.stepper = null;
    this.knobs = {};
    this.sliders = {};
    this.leds = {};
    this.rgb_leds = {};
    this.indexed_leds = {};
    this.lcd = {};

    this.isRGB = true;

    // For the Maschine mk3 we needed to introduce a second set of output packets,
    // so now we maintain a keyed dict of { dirty, outPacket, invalidateOutput,
    // sendOutput }.
    this.outputInfo = {};

    // Same deal for inputs.
    this.inputWidgetGroups = {};
    this.inputFirstByteToGroupName = new Map();

    const brightestValue = config.ledBrightestValue;

    const processInputBlock = (name, iconf) => {
      // previously, input processing would just run over all the dicts and tell
      // them to parse, but because we now segment by packet, it's simplest to
      // just linearly stash widgets per input group.
      const widgets = [];
      this.inputWidgetGroups[name] = widgets;

      const firstByte = normInt(iconf.firstByte);
      this.inputFirstByteToGroupName.set(firstByte, name);

      if (iconf.buttons) {
        for (var key in iconf.buttons) {
          const b = this.buttons[key] = new Button(key, iconf.buttons[key], this);
          widgets.push(b);
        }
      }

      if (iconf.steppers) {
        for (var key in iconf.steppers) {
          const s = this.stepper =
            new StepWheel(key, iconf.steppers[key], this);
          widgets.push(s);
        }
      }


      if (iconf.knobs) {
        for (var key in iconf.knobs) {
          const k = this.knobs[key] = new Slider(key, iconf.knobs[key], this);
          widgets.push(k);
        }
      }

      if (iconf.sliders) {
        for (var key in iconf.sliders) {
          const s = this.sliders[key] = new Slider(key, iconf.sliders[key], this);
          widgets.push(s);
        }
      }

      if (iconf.packetized_pads) {
        const p = new PacketizedPads(iconf.packetized_pads, this, normInt);
        widgets.push(p);
        for (let iPad = 1; iPad <= p.padCount; iPad++) {
          const name = p.prefix + iPad;
          this.buttons[name] = p;
        }
      }
    };

    const processOutputBlock = (name, oconf) => {
      // Setup the output packet.
      const packetLength = normInt(oconf.length);
      const outPacket = new Array(packetLength);
      for (let i = 1; i < packetLength; i++) {
        outPacket[i] = 0;
      }
      if ("firstByte" in oconf) {
        outPacket[0] = normInt(oconf.firstByte);
      }
      // Note that the functions below have this=BaseController and we capture the
      // oinfo for manipulating dirty in an externally inspectable way.
      const oinfo = this.outputInfo[name] = {
        dirty: false,
        outPacket,
        invalidateOutput: () => {
          if (!oinfo.dirty) {
            oinfo.dirty = true;
            setImmediate(oinfo.sendOutput);
          }
        },
        sendOutput: () => {
          try {
            this.device.write(outPacket);
            oinfo.dirty = false;
          }
          catch(ex) {
            console.log(`failed write of ${name}`, ex);
            console.log(`outPacket was: ${outPacket.join('   ')}`)
          }
        }
      };

      if (oconf.leds) {
        for (var key in oconf.leds) {
          this.leds[key] = new LED(oconf.leds[key], brightestValue, outPacket,
                                   oinfo.invalidateOutput);
        }
      }

      if (oconf.rgb_leds) {
        for (var key in oconf.rgb_leds) {
          this.rgb_leds[key] = new LED_RGB(oconf.rgb_leds[key], outPacket,
                                           oinfo.invalidateOutput);
        }
      }

      if (oconf.indexed_leds) {
        const indexed_led_mapping = oconf.indexed_led_mapping;
        // ugly side-effect thing: if there's a mapping, assume there's no RGB
        // support.
        this.isRGB = false;
        for (let key in oconf.indexed_leds) {
          this.indexed_leds[key] = new LED_Indexed(
            indexed_led_mapping,
            oconf.indexed_leds[key],
            outPacket, oinfo.invalidateOutput);
        }
      }

      if (oconf.lcd) {
        for (var key in oconf.lcd) {
          this.lcd[key] = new LCDDigit(oconf.lcd[key], outPacket,
                                       oinfo.invalidateOutput);
        }
      }
    };

    const processDisplayBlock = (key, config) => {
      this.displays = new LCDDisplays({
        vendorId,
        productId,
        displayConfig: config
      });
    };

    for (let key in config) {
      if (key.startsWith('input')) {
        processInputBlock(key, config[key]);
      }

      if (key.startsWith('output')) {
        processOutputBlock(key, config[key]);
      }

      if (key === 'displays') {
        processDisplayBlock(key, config[key]);
      }
    }

    try {
      this.device = new HID.HID(vendorId, productId);
    }
    catch(e) {
      console.log(`Could not connect to ${controllerName}:`, e);
    }

    this.device.on("data", this.parseInput.bind(this));
    this.device.on("error", (ex) => {
      console.log("device error:", ex);e
    });
  }

  parseInput(data) {
    const firstByte = data[0];
    const groupName = this.inputFirstByteToGroupName.get(firstByte);

    if (!groupName) {
      console.warn("Received input with unknown first byte",
                   firstByte.toString(16));
      return;
    }

    const widgets = this.inputWidgetGroups[groupName];
    for (const widget of widgets) {
      widget.parseInput(data);
    }
  }

  setLED(which,value) {
    this.leds[which].setBrightness(value);
  }

  setWhiteBrightness(which, value) {
    this.leds[which].setWhiteBrightness(value);
  }

  setIndexedColor(which, value) {
    this.indexed_leds[which].setIndexedColor(value);
  }

  setRGB(which,r,g,b) {
    let led = this.rgb_leds[which] || this.indexed_leds[which];
    led.setRGB(r,g,b);
  }

  setLCDChar(which,char) {
    this.lcd[which].setChar(char);
  }

  setLCD(which,brightness) {
    this.lcd[which].setBrightness(char);
  }

  setLCDString(message) {
    if(message.length == 1) {
      message = " " + message;
    }
    this.lcd.l.setChar(message[0]);
    this.lcd.r.setChar(message[1]);
  }

  setLCDDot(which, brightness) {
    this.lcd[which].setDot(brightness);
  }
}

module.exports = BaseController;
