import { MaschineMk2Mikro } from "../../lib/maschine_mk2_mikro";

export const runDemo = (mk2mikro: MaschineMk2Mikro, screenData) =>
  mk2mikro.init().then(() => {
    // ## Group Pads: Display colors with transient "flash" on press.

    mk2mikro.on('p:pressed', (index, pressure) => {
      console.log(`pad #${index} pressed. pressure: ${pressure}`);
    });

    mk2mikro.on('p:pressure', (index, pressure) => {
      // console.log(`pad #${index} pressure: ${pressure}`);
    });

    mk2mikro.on('p:released', (index) => {
      console.log(`pad #${index} released`);
    });

    // ## Big Pads: One color per pad, vary brightness based on pressure.
    for (let i = 1; i <= 16; i++) {
      const li = i;
      const li0 = li - 1;
      const name = `p${i}`;
      const led = mk2mikro.rgb_leds[name];
      led.setColorByNumberHelper(li0);
      mk2mikro.on(`${name}:pressure`, (pressure) => {
        led.setColorByNumberHelper(li0);
        led.setWhiteBrightness(Math.round(pressure / 100));
      });
    }

    mk2mikro.on(`stepper:step`, ({ direction }) => {
      console.log(`stepper: ${direction < 0 ? "decrement" : "increment"}`);
    });

    mk2mikro.oled_displays.mainScreen.clearScreen();
    mk2mikro.oled_displays.mainScreen.paintScreen(screenData);

    console.log("init completing, stuff should theoretically happen now.");
  });
