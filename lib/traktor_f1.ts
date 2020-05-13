import { BaseController } from "./base_controller";
import f1Config from "./traktor_f1_config.json";

export class TraktorF1 extends BaseController {
  constructor() {
    super(f1Config);
  }
}
