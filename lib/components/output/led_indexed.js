/* The Maschine mk3 supports a finite indexed set of LED colors.  (Presumably
 * this simplifies things for the drivers, especially on USB bus power.)
 *
 * The NI Controller Editor PDF provides a table that's pretty accurate, noting
 * that the mk3 touch slider dot LEDs and directional encoder dot LEDs cannot do
 * white; they get truncated to be colors.  They may also exist in a somewhat
 * different color-space.

 * For each color, there are 4 variants: "dim", "dim flash", "bright", and
 * "flash".  "Flash" seems to be intended to mean "pressed" and seems to be a
 * whiter, less saturated version of the base color.  That is, the colors don't
 * form a line in any color-space, but rather a square.  This is much more
 * noticable for the dot LEDs than the pad LEDs.  At least in daylight, the
 * "dim flash" color usually looks like it's on a 3-color linear HSV value
 * ramp, although for some colors there's a hint of discoloration in the middle.
 * And the "flash" color looks notably whiter.  With daylight involved, however,
 * it seems like "dim" is too dim and it's better to only use the upper 3 colors
 * which should be largely distinguishable.
 *
 * The 16 colors are roughly hue-spaced.  NI has basically chosen to add "warm
 * yellow", deleting an extra weird green-cyan color.  While I don't really
 * miss the deleted color, the yellows are super hard to visually distinguish
 * compared to the lost color, so it's not much of a win.
 */
const colorTable = [
  'red',
  'orange',
  'light orange',
  'warm yellow', // in hue space this would just be yellow
  'yellow', // in hue space this would be lime
  'lime', // in hue space this would be green
  'green', // in hue space this would be mint
  'mint', // in hue space this would be a greenish-cyan
  'cyan',
  'turquoise',
  'blue',
  'plum',
  'violet',
  'purple',
  'magenta',
  'fuschia'
];
const COLORS_START_OFFSET = 4;
const WHITE_START_OFFSET = 68;
const DIM_OFFSET = 0;
const DIM_FLASH_OFFSET = 1;
const BRIGHT_OFFSET = 2;
const BRIGHT_FLASH_OFFSET = 3;

const LED_Indexed = function(config, outPacket, invalidateOutput) {
  var index = 0;

  var updateOutputPacket = function() {
    outPacket[config.addr] = index;
    invalidateOutput();
  };

  return {
    /** Set the value explicitly, for callers who know exactly what's going on.
     */
    setIndexedColor(_index) {
      index = _index;
      updateOutputPacket();
    },

    setBlack() {
      index = 0;
      updateOutputPacket();
    },

    /** Set white with a brightness in the range [0, 1] mapping to black if
     * < 0.2 and to 4 shades of white for the next 0.8.
     */
    setWhiteBrightness(f) {
      // map onto [0, 4].  Maybe it would make more sense to use ceil and only
      // have black be mapped for an explicit 0?
      const i = Math.max(0, Math.min(4, Math.floor(f * 5)));
      if (i === 0) {
        index = 0;
      } else {
        index = WHITE_START_OFFSET - 1 + i;
      }
      updateOutputPacket();
    },

    setWhite() {
      index = WHITE_START_OFFSET + BRIGHT_FLASH_OFFSET;
      updateOutputPacket();
    },

    setColorByNumberHelper(color16, bright, flash) {
      index = COLORS_START_OFFSET + color16 * 4 +
                (bright ? 2 : 0) + (flash ? 1 : 0);
      updateOutputPacket();
    }

    // TODO: maybe an RGB or HSV helper that down-maps?  Although consumers are
    // best just being aware of the index limitations.  The best thing may be
    // to also expose indexed colors on RGB hardware too.
  };
};

module.exports = LED_Indexed;
