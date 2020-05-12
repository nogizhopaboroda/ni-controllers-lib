import { MaschineMk3 } from "../lib/maschine_mk3";

export const runBasicDemo = (maschine: MaschineMk3) =>
  maschine.init().then(() => {
    maschine.setRGB("p1", 255, 0, 0);
    maschine.on("p:pressed", (index, pressure) => {
      console.log({ index, pressure });
    });

    maschine.on("p:pressure", (index, pressure) => {
      console.log({ index, pressure });
    });

    maschine.on("g1:pressed", (data) => {
      console.log(data);
    });
  });
