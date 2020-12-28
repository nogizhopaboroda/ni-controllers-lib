import { MaschineMk2Mikro } from "../../lib/maschine_mk2_mikro";
import { createWebHidAdapter, createWebUsbAdapter } from "../../lib/usb/web";
import urlPlaceholderJpeg from "./placeholder.jpeg";
import { runDemo } from "./runDemo";

fetch(urlPlaceholderJpeg)
  .then((response) => response.arrayBuffer())
  .then((jpegData) => {
    document.addEventListener("click", () => {
      document.body.innerHTML = "Running";
      runDemo(
        new MaschineMk2Mikro(createWebHidAdapter, createWebUsbAdapter),
        jpegData
      ).catch((error) => {
        document.body.innerHTML = `Error: ${error.message}`;
        console.error(error);
      });
    });
  })
