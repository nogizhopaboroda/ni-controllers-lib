import { BaseController } from "./base_controller";
import mk3Config from "./maschine_mk3_config.json";

interface MaschineMk3EventMap {
  "p:pressed": (index: number, pressure: number) => void;
  "p:pressure": (index: number, pressure: number) => void;
  "p:released": (index: number, pressure: 0) => void;
}

export class MaschineMk3 extends BaseController {
  constructor() {
    super(mk3Config);
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
