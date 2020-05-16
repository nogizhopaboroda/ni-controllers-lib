import { MaschineMk3 } from "../../lib/maschine_mk3";
import { createNodeHidAdapter, createNodeUsbAdapter } from "../../lib/usb/node";
import { runDemo } from "./runDemo";

runDemo(new MaschineMk3(createNodeHidAdapter, createNodeUsbAdapter)).catch(
  console.error
);
