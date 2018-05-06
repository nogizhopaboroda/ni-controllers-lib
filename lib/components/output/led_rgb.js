const tinycolor = require('tinycolor2');

var LED_RGB = function(config, outPacket, invalidateOutput) {
  var r = 0;
  var g = 0;
  var b = 0;

  var updateOutputPacket = function() {
    outPacket[config.rAddr] = Math.floor(r/2);
    outPacket[config.gAddr] = Math.floor(g/2);
    outPacket[config.bAddr] = Math.floor(b/2);
    invalidateOutput();
  };

  return {
    setRGB: function(newR, newG, newB) {
      r = newR;
      g = newG;
      b = newB;
      updateOutputPacket();
    },

    setHSV: function(h, s, v) {
      const color = tinycolor({ h, s, v }).toRgb();
      r = color.r;
      g = color.g;
      b = color.b;
      updateOutputPacket();
    }
  };
};

module.exports = LED_RGB;
