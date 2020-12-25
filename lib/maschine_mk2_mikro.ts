import { BaseController } from "./base_controller";
import mk2MikroConfig from "./maschine_mk2_mikro_config.json";
import type { HidAdapterFactory, UsbAdapterFactory } from "./usb/adapter";

interface MaschineMk3EventMap {
  "p:pressed": (index: number, pressure: number) => void;
  "p:pressure": (index: number, pressure: number) => void;
  "p:released": (index: number, pressure: 0) => void;
  "stepper:step": (data: { direction: -1 | 1 }) => void;
}

export class MaschineMk2Mikro extends BaseController {
  constructor(createHid: HidAdapterFactory, createUsb: UsbAdapterFactory) {
    super(mk2MikroConfig, createHid, createUsb);
  }

  // to enable overloads declaration we need the impl to be in the site
  // so thi is just a pass through to the base implementation
  on<E extends keyof MaschineMk3EventMap>(
    event: E,
    listener: MaschineMk3EventMap[E]
  ): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void) {
    return super.on(event, listener);
  }
}
