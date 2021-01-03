# Traktor F1, Traktor D2, and Maschine MK3 controller access

This is a forked version of https://github.com/met5678/node-traktor-f1 with
the following changes:

- Minor bit-rot fixes and cleanup of things that appeared to be in-progress
  refactoring.
- Maschine MK3 support (good quality)
- Traktor D2 support (alpha quality)
- Some minimal attempts at making things slightly more generic, but in general
  I've just continued in the direction of the original version of the library.
  It worked and my `taskolio` consumer has somewhat of an abstraction boundary
  so it doesn't need things to be 100% beautiful.
- WebUSB and WebHID support. As of may 2020 it's only supported in Blink based
  browser (Chrome etc.) with [enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)
  turned on.

Note that the MIT-licensed https://github.com/shaduzlabs/cabl has also provided
invaluable information about the Mk3 device and its lower level protocols on one
of its branches.

The D2 setup was primarily determined by leveraging the F1 and Mk3 "protocol"
knowledge and brute force experimentation.

## General Device Capabilities

### Traktor F1

- RGB pads (4x4)
- Monochromatic LEDs with a range of 0-127

### Traktor D2

- RGB pads (4x2)
- 1 LCD Display
- Ridiculously honking big.

### Mashine Mk2 Mikro

- Indexed color pads (4x4).
- Monochromatic LEDs with a range of 0-63
- OLED Display

### Mashine Mk3

- Indexed color pads (4x4) and group buttons (4x2). Massively more limited
  color options.
- Monochromatic LEDs with a range of 0-63
- 2 LCD Displays

## Examples

You can find examples for both node and web runtimes in the [examples](./examples)
folder. Plug your Maschine MK3 and then run (on MacOS, you may need to kill the
`NIHostIntegrationAgent` process. It seems to claim the USB interface and prevent
the browser from accessing it)

```bash
npm run example:maschinemk3:node
```

or for the web run the following and then navigate to http://localhost:1234

```bash
npm run example:maschinemk3:web
```
