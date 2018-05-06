class Button {
  constructor(name, config, controller) {
    this.name = name;
    this.addr = config.addr;
    this.bitmask = parseInt(config.bitmask, 16);
    this.controller = controller;

    this.pressed = 0;
  }

  parseInput(data) {
    const isPressed = data[this.addr] & this.bitmask;
    if (this.pressed ^ isPressed) {
      this.pressed = isPressed;
      this.controller.emit(this.name +
                           (this.pressed ? ":pressed" : ":released"));
    }
  }
};

module.exports = Button;
