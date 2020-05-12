import { MaschineMk3 } from "../lib/maschine_mk3";
import { createWebHidAdapter, createWebUsbAdapter } from "../lib/usb/web";
import { runBasicDemo } from "./runBasicDemo";

document.addEventListener("click", () => {
  document.body.innerHTML = "Running";
  runBasicDemo(new MaschineMk3(createWebHidAdapter, createWebUsbAdapter)).catch(
    (error) => {
      document.body.innerHTML = `Error: ${error.message}`;
      console.error(error);
    }
  );
});
