import { MaschineMk2Mikro } from "../../lib/maschine_mk2_mikro";
import { createWebHidAdapter, createWebUsbAdapter } from "../../lib/usb/web";
import { runDemo } from "./runDemo";

document.addEventListener("click", () => {
  document.body.innerHTML = "Running";
  runDemo(new MaschineMk2Mikro(createWebHidAdapter, createWebUsbAdapter)).catch(
    (error) => {
      document.body.innerHTML = `Error: ${error.message}`;
      console.error(error);
    }
  );
});
