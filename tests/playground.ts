import { MaschineMk3 } from "../lib/maschine_mk3";
import { createNodeHidAdapter, createNodeUsbAdapter } from "../lib/usb/node";
import { runBasicDemo } from "./runBasicDemo";

runBasicDemo(new MaschineMk3(createNodeHidAdapter, createNodeUsbAdapter)).catch(
  console.error
);
