import { MaschineMk3 } from "../../lib/maschine_mk3";
import { createWebHidAdapter, createWebUsbAdapter } from "../../lib/usb/web";
import { runDemo } from "./runDemo";

document.addEventListener("click", () => {
  document.body.innerHTML = "Running";
  runDemo(new MaschineMk3(createWebHidAdapter, createWebUsbAdapter)).catch(
    (error) => {
      document.body.innerHTML = `Error: ${error.message}`;
      console.error(error);
    }
  );
});
