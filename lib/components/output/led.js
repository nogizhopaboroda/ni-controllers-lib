/**
 * F1 style mono LED.
 */
var LED = function(config, outPacket, invalidateOutput) {
  var brightness = 0;

  var updateOutputPacket = function() {
    outPacket[config.addr] = brightness == 1 ? 127 : Math.floor(brightness*128);
    invalidateOutput();
  };

  return {
    setBrightness: function(newBrightness) {
      brightness = newBrightness;
      updateOutputPacket();
    },
    setOn: function() {
      brightness = 1;
      updateOutputPacket();
    },
    setOff: function() {
      brightness = 0;
      updateOutputPacket();
    }
  };
};

module.exports = LED;
