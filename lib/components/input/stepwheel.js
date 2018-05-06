class StepWheel {
  constructor(name, config, controller) {
    this.name = name;
    this.addr = config.addr;
    this.controller = controller;

    this.step = 0;
  }

  parseInput(data) {
    const newStep = data[this.addr];
    if(newStep == this.step) {
      return;
    }

    if (newStep > this.step) {
      this.controller.emit(this.name + ':step', { direction: 1 });
    } else if (newStep < this.step) {
      this.controller.emit(this.name + ':step', { direction: -1 });
    }
    this.step = newStep;
  }
};

module.exports = StepWheel;
