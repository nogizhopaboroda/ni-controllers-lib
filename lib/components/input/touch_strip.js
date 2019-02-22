/**
 * 32 bits of touch-strip data somehow.
 */
class TouchStrip {
  constructor(name, config, controller) {
    this.name = name;
    this.config = config;
    this.controller = controller;

    this._position = 0;
    this.value = 0;
  }

  parseInput(data) {
    // So, this really isn't a timestamp.
    let timestamp = data[this.config.timeLsb] + (data[this.config.timeMsb] << 8);
    let newVal = data[this.config.dataLsb] + (data[this.config.dataMsb] << 8);

    if(newVal != this._position) {
      this._position = newVal;

      this.value = newVal / 1024;
      this.controller.emit(this.name + ':changed', { value: this.value, timestamp });
    }
  }
}

module.exports = TouchStrip;
