import { MaschineMk3 } from "./lib/maschine_mk3";

const maschineMk3 = new MaschineMk3();

maschineMk3.setRGB("p1", 255, 0, 0);
maschineMk3.on("p:pressed", (index, pressure) => {
  console.log({ index, pressure });
});

maschineMk3.on("p:pressure", (index, pressure) => {
  console.log({ index, pressure });
});

maschineMk3.on("g1:pressed", (data) => {
  console.log(data);
});
