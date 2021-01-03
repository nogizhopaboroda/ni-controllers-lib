import { MaschineMk2Mikro } from "../../lib/maschine_mk2_mikro";
import { createNodeHidAdapter, createNodeUsbAdapter } from "../../lib/usb/node";
import monroeData from './monroe';
import { runDemo } from "./runDemo";

runDemo(
  new MaschineMk2Mikro(createNodeHidAdapter, createNodeUsbAdapter),
  monroeData
)
