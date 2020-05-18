// The D2 has 2 packet configurations:
//
// ## First Byte is 1 ##
// The packet length is 17.
//
// The highest bytes, (zero-based) 13-16 cover the touch strip.
//
// ## First Byte is 2 ##
// The packet length is 25.
//
// An additional 8 bytes seem to be inserted when the sliders are in play.  The
// insertion seems to happen at byte 9.
//

import { BaseController } from "./base_controller";
import d2Config from "./traktor_d2_config.json";
import type { HidAdapterFactory, UsbAdapterFactory } from "./usb/adapter";

export class TraktorD2 extends BaseController {
  constructor(createHid: HidAdapterFactory, createUsb: UsbAdapterFactory) {
    super(d2Config, createHid, createUsb);
  }
}
