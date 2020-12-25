import { MaschineMk2Mikro } from "../../lib/maschine_mk2_mikro";

export const runDemo = (mk2micro: MaschineMk2Mikro) =>
  mk2micro.init().then(() => {
    // ## Group Pads: Display colors with transient "flash" on press.

    mk2micro.on('p:pressed', (index, pressure) => {
      console.log(`pad #${index} pressed. pressure: ${pressure}`);
    });

    mk2micro.on('p:pressure', (index, pressure) => {
      console.log(`pad #${index} pressure: ${pressure}`);
    });

    mk2micro.on('p:pressed', (index) => {
      console.log(`pad #${index} released`);
    });

    mk2micro.on('navUp:pressed', (index) => {
      console.log(`navUp pressed`);
    });

    mk2micro.on('navDown:pressed', (index) => {
      console.log(`navDown pressed`);
    });

    mk2micro.on('navLeft:pressed', (index) => {
      console.log(`navLeft pressed`);
    });

    mk2micro.on('navRight:pressed', (index) => {
      console.log(`navRight pressed`);
    });

    for (let i = 1; i <= 8; i++) {
      const li = i;
      const li0 = li - 1;
      const name = `g${i}`;
      const led = mk2micro.indexed_leds[name];
      led.setColorByNumberHelper(li0, true, false);
      mk2micro.on(`${name}:pressed`, () => {
        console.log(`${name} pressed`);
        led.setColorByNumberHelper(li0, true, true);
      });
      mk2micro.on(`${name}:released`, () => {
        console.log(`${name} released`);
        led.setColorByNumberHelper(li0, true, false);
      });
    }

    // ## Big Pads: One color per pad, vary brightness based on pressure.
    for (let i = 1; i <= 16; i++) {
      const li = i;
      const li0 = li - 1;
      const name = `p${i}`;
      const led = mk2micro.indexed_leds[name];
      led.setColorByNumberHelper(li0, false, false);
      // note, could alternately do a single listen on "p:pressure", which passes
      // the index.
      mk2micro.on(`${name}:pressure`, (pressure) => {
        led.setColorByNumberHelper(
          li0,
          pressure > 2048,
          pressure % 2048 > 1024
        );
      });
    }

    // ## Knobs: On touch, override the pads and do RGB/spread for each
    for (let i = 1; i <= 8; i++) {
      mk2micro.on(`knobTouch${i}`, (touched) => {
        console.log(`knob #${i} ${touched}`);
      });
    }

    mk2micro.on(`stepper:step`, ({ direction }) => {
      console.log(`stepper: ${direction < 0 ? "decrement" : "increment"}`);
    });

    for (let i = 1; i <= 2; i++) {
      mk2micro.on(`touchStrip${i}:changed`, ({ value, timestamp }) => {
        const hexTime = timestamp.toString(16).padStart(4, "0");
        console.log(`touchStrip ${i}: ${hexTime} ${value}`);
      });
    }

    console.log("init completing, stuff should theoretically happen now.");
  });
