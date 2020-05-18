import { BaseController } from "./base_controller";
import f1Config from "./traktor_f1_config.json";
import type { HidAdapterFactory, UsbAdapterFactory } from "./usb/adapter";

export class TraktorF1 extends BaseController {
  constructor(createHid: HidAdapterFactory, createUsb: UsbAdapterFactory) {
    super(f1Config, createHid, createUsb);
  }
}
