import { promises as fsPromises } from "fs";
import * as path from "path";
import { MaschineMk2Mikro } from "../../lib/maschine_mk2_mikro";
import { createNodeHidAdapter, createNodeUsbAdapter } from "../../lib/usb/node";
import { runDemo } from "./runDemo";

fsPromises
  .readFile(path.join(__dirname, "placeholder.jpeg"))
  .then((jpegData) =>
    runDemo(
      new MaschineMk2Mikro(createNodeHidAdapter, createNodeUsbAdapter),
      jpegData
    )
  )
  .catch(console.error);
