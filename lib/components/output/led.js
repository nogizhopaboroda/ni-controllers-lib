/**
 * Mono-colored LED with a value between 0 and whatever brightestValue is, which
 * is set on a device level.  The Traktor Kontrol F1 uses a brightestValue of
 * 127 and the Maschine Mk3 uses a brightest value of 63.
 */
var LED = function(config, brightestValue, outPacket, invalidateOutput) {
  var brightness = 0;

  var updateOutputPacket = function() {
    outPacket[config.addr] = Math.floor(brightness * brightestValue);
    invalidateOutput();
  };

  return {
    /* 0 to 1.0 scale */
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
    },
    setBool: function(val) {
      brightness = val ? 1 : 0;
      updateOutputPacket();
    }
  };
};

module.exports = LED;
