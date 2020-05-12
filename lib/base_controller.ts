import { EventEmitter } from "events";

import { Button, ButtonConfig } from "./components/input/button";
import {
  PacketizedPads,
  PacketizedPadsConfig,
} from "./components/input/packetized_pads";
import { Slider, SliderConfig } from "./components/input/slider";
import { StepWheel, StepWheelConfig } from "./components/input/stepwheel";
import { TouchStrip, TouchStripConfig } from "./components/input/touch_strip";
import { Widget } from "./components/input/Widget";
import { LCDDigit, LcdDigitConfig } from "./components/output/lcd_digit";
import { LED, LedConfig } from "./components/output/led";
import {
  LED_Indexed,
  LedIndexedConfig,
  LedIndexedMapping,
} from "./components/output/led_indexed";
import { LED_RGB, LedRgbConfig } from "./components/output/led_rgb";
import {
  LCDDisplays,
  LcdDisplaysConfig,
} from "./components/output/ni_lcd_displays";
import {
  HidAdapter,
  requestHidDevice,
  requestUsbDevice,
  UsbAdapter,
} from "./usb/usb_adapter";

interface InputConf {
  firstByte: string;
  buttons?: Record<string, ButtonConfig>;
  steppers?: Record<string, StepWheelConfig>;
  knobs?: Record<string, SliderConfig>;
  sliders?: Record<string, SliderConfig>;
  touchStrips?: Record<string, TouchStripConfig>;
  packetized_pads?: PacketizedPadsConfig;
}

interface OutputConf {
  length: number;
  firstByte?: string;
  leds?: Record<string, LedConfig>;
  rgb_leds?: Record<string, LedRgbConfig>;
  indexed_leds?: Record<string, LedIndexedConfig>;
  lcd?: Record<string, LcdDigitConfig>;
}

interface OutputInfo {
  dirty: boolean;
  invalidateOutput: () => void;
  outPacket: Uint8Array;
  sendOutput: () => void;
}

function normInt(val: string | number) {
  if (typeof val === "string") {
    if (val.startsWith("0x")) {
      // parseInt does assume this itself if we leave the radix unspecified,
      // but it's bad form to not specify a radix for parsing and we might want
      // to throw because we really do want all string numbers to be base-16
      // and such.
      return Number.parseInt(val, 16);
    } else {
      console.warn("weirdly formatted string, using radix 10:", val);
      return Number.parseInt(val, 10);
    }
  } else {
    return val;
  }
}

export class BaseController extends EventEmitter {
  readonly buttons: Record<string, Button | PacketizedPads> = {};
  readonly knobs: Record<string, unknown> = {};
  readonly sliders: Record<string, Slider> = {};
  readonly touchStrips: Record<string, TouchStrip> = {};
  readonly leds: Record<string, LED> = {};
  readonly rgb_leds: Record<string, LED_RGB> = {};
  readonly indexed_leds: Record<string, LED_Indexed> = {};
  readonly lcd: Record<string, LCDDigit> = {};

  stepper: StepWheel | null = null;

  displays: LCDDisplays | null = null;

  // For the Maschine mk3 we needed to introduce a second set of output packets,
  // so now we maintain a keyed dict of { dirty, outPacket, invalidateOutput,
  // sendOutput }.
  readonly outputInfo: Record<string, OutputInfo> = {};

  // Same deal for inputs.
  readonly inputWidgetGroups: Record<string, Array<Widget>> = {};
  readonly inputFirstByteToGroupName = new Map<number, string>();

  isRGB = true;

  constructor(
    readonly config: {
      name: string;
      vendorId: number;
      productId: number;
      ledBrightestValue: number;
      indexed_led_mapping?: LedIndexedMapping;
      input: InputConf;
      input2?: InputConf;
      output: OutputConf;
      output2?: OutputConf;
      displays?: LcdDisplaysConfig;
    }
  ) {
    super();
  }

  async init(runtime: "node" | "web" = "node") {
    const hidDevice = await requestHidDevice(
      this.config.vendorId,
      this.config.productId,
      runtime
    );
    const usbDevice = await requestUsbDevice(
      this.config.vendorId,
      this.config.productId,
      runtime
    );

    for (let key in this.config) {
      if (key === "input" || key === "input2") {
        const inputConfig = this.config[key];
        if (inputConfig != null) {
          this.processInputBlock(key, inputConfig, hidDevice);
        }
      }

      if (
        (key === "output" || key === "output2") &&
        this.config.indexed_led_mapping != null
      ) {
        const outputConfig = this.config[key];
        if (outputConfig != null) {
          this.processOutputBlock(
            key,
            outputConfig,
            this.config.ledBrightestValue,
            this.config.indexed_led_mapping,
            hidDevice
          );
        }
      }

      if (key === "displays") {
        let displaysConfig = this.config[key];
        if (displaysConfig != null) {
          this.processDisplayBlock(usbDevice, displaysConfig);
        }
      }
    }
  }

  processInputBlock(name: string, iconf: InputConf, hidDevice: HidAdapter) {
    // previously, input processing would just run over all the dicts and tell
    // them to parse, but because we now segment by packet, it's simplest to
    // just linearly stash widgets per input group.
    const widgets: Array<Widget> = [];
    this.inputWidgetGroups[name] = widgets;

    const firstByte = normInt(iconf.firstByte);
    this.inputFirstByteToGroupName.set(firstByte, name);

    if (iconf.buttons) {
      for (let key in iconf.buttons) {
        const b = (this.buttons[key] = new Button(
          key,
          iconf.buttons[key],
          this
        ));
        widgets.push(b);
      }
    }

    if (iconf.steppers) {
      for (let key in iconf.steppers) {
        const s = (this.stepper = new StepWheel(
          key,
          iconf.steppers[key],
          this
        ));
        widgets.push(s);
      }
    }

    if (iconf.knobs) {
      for (let key in iconf.knobs) {
        const k = (this.knobs[key] = new Slider(key, iconf.knobs[key], this));
        widgets.push(k);
      }
    }

    if (iconf.sliders) {
      for (let key in iconf.sliders) {
        const s = (this.sliders[key] = new Slider(
          key,
          iconf.sliders[key],
          this
        ));
        widgets.push(s);
      }
    }

    if (iconf.touchStrips) {
      for (let key in iconf.touchStrips) {
        const ts = (this.touchStrips[key] = new TouchStrip(
          key,
          iconf.touchStrips[key],
          this
        ));
        widgets.push(ts);
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

    hidDevice.onData(this.parseInput.bind(this));
  }

  processOutputBlock(
    name: string,
    oconf: OutputConf,
    brightestValue: number,
    indexedLedMapping: LedIndexedMapping,
    hidDevice: HidAdapter
  ) {
    // Setup the output packet.
    const packetLength = normInt(oconf.length);
    const outPacket = new Uint8Array(packetLength);
    for (let i = 1; i < packetLength; i++) {
      outPacket[i] = 0;
    }
    if (oconf.firstByte != null) {
      outPacket[0] = normInt(oconf.firstByte);
    }
    // Note that the functions below have this=BaseController and we capture the
    // oinfo for manipulating dirty in an externally inspectable way.
    const oinfo: OutputInfo = (this.outputInfo[name] = {
      dirty: false,
      outPacket,
      invalidateOutput: () => {
        if (!oinfo.dirty) {
          oinfo.dirty = true;
          setImmediate(oinfo.sendOutput);
        }
      },
      sendOutput: async () => {
        try {
          // todo not convinced we need to a transform to an actual array
          await hidDevice.write(Array.from(outPacket));
          oinfo.dirty = false;
        } catch (ex) {
          console.log(`failed write of ${name}`, ex);
          console.log(`outPacket was: ${outPacket.join("   ")}`);
        }
      },
    });

    if (oconf.leds != null) {
      for (let key in oconf.leds) {
        this.leds[key] = new LED(
          oconf.leds[key],
          brightestValue,
          outPacket,
          oinfo.invalidateOutput
        );
      }
    }

    if (oconf.rgb_leds != null) {
      for (let key in oconf.rgb_leds) {
        this.rgb_leds[key] = new LED_RGB(
          oconf.rgb_leds[key],
          outPacket,
          oinfo.invalidateOutput
        );
      }
    }

    if (oconf.indexed_leds != null) {
      // ugly side-effect thing: if there's a mapping, assume there's no RGB
      // support.
      this.isRGB = false;
      for (let key in oconf.indexed_leds) {
        this.indexed_leds[key] = new LED_Indexed(
          indexedLedMapping,
          oconf.indexed_leds[key],
          outPacket,
          oinfo.invalidateOutput
        );
      }
    }

    if (oconf.lcd != null) {
      for (let key in oconf.lcd) {
        this.lcd[key] = new LCDDigit(
          oconf.lcd[key],
          outPacket,
          oinfo.invalidateOutput
        );
      }
    }
  }

  processDisplayBlock(device: UsbAdapter, config: LcdDisplaysConfig) {
    this.displays = new LCDDisplays({
      device,
      displayConfig: config,
    });
  }

  parseInput(data: Uint8Array) {
    const firstByte = data[0];
    const groupName = this.inputFirstByteToGroupName.get(firstByte);

    if (!groupName) {
      console.warn(
        "Received input with unknown first byte",
        firstByte.toString(16)
      );
      return;
    }

    const widgets = this.inputWidgetGroups[groupName];
    for (const widget of widgets) {
      widget.parseInput(data);
    }
  }

  setLED(which: string, value: number) {
    this.leds[which].setBrightness(value);
  }

  setWhiteBrightness(which: string, value: number) {
    this.indexed_leds[which].setWhiteBrightness(value);
  }

  setIndexedColor(which: string, value: number) {
    this.indexed_leds[which].setIndexedColor(value);
  }

  setRGB(which: string, r: number, g: number, b: number) {
    let led = this.rgb_leds[which] ?? this.indexed_leds[which];
    led.setRGB(r, g, b);
  }

  setLCDChar(which: string, char: string) {
    this.lcd[which].setChar(char);
  }

  setLCD(which: string, value: number) {
    this.lcd[which].setBrightness(value);
  }

  setLCDString(message: string) {
    if (message.length == 1) {
      message = ` ${message}`;
    }
    this.lcd.l.setChar(message[0]);
    this.lcd.r.setChar(message[1]);
  }

  setLCDDot(which: string, brightness: number) {
    this.lcd[which].setDot(brightness);
  }
}
