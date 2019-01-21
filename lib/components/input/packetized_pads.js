const PRESS_THRESHOLD = 256;

/**
 * This handles the Maschine mk3 pad pressure messages.  I started out trying to
 * make this generic, then gave up.  The JSON is now designed to just give a
 * general idea of what's going on.
 *
 * The USB packet starts with 0x02 and contains potentially up to 21 sub-packets
 * of 3 byte tuples.  The bytes are:
 * [ 1 byte: pad index] [ 4 bits: weird, 4 bits: MSB nibble ] [ 1 byte: LSB ]
 *
 * The packets are delta-packets.  They are only generated when there is a
 * change and they are only generated for pads for which there has been a
 * change.  There will always be at least one entry.  There will always be a
 * sentinel all-zero entry after the last meaningful entry.  Anything beyond
 * that entry is previous buffer state and should be ignored; the mk3 does not
 * clear the memory.  A pad cannot be listed twice in one packet.
 *
 * I'm not sure what's up with the "weird" nibble.  It usually has the value 4,
 * but in the 2nd-to-last packet in a release it may have the value 2 or 3 when
 * the reported pressure is 0.  But then it gets followed by another packet
 * where the value is 4 again with the pressure still being 0.
 *
 * Because of the above rules, if a 0 index is observed in the first packet, it
 * is always going to be an actual pad pressure.  A 0 index in any other slot
 * serves as an end-of-packet indicator (because of sorting), although if we
 * treat that weird nibble as a validity indicator, we can also consult that.
 *
 * NOTE: I've experimentally added events for just the prefix that carry the
 * index as the first payload.  The idea is that it's dumb to manually have to
 * re-constitute the group relationship downstream.  But the F1 grid needs to
 * get some support for that, then.  (Maybe just some type of filter predicate
 * that tells the button the broadcast logic?  Or just a separate listener that
 * auto-listens to each button?)
 */
class PacketizedPads {
  constructor(config, controller, normInt) {
    this.startOffset = normInt(config.start);
    this.repeatCount = normInt(config.repeated);
    this.eachLength = normInt(config.length);
    this.padCount = normInt(config.padCount);
    this.prefix = config.prefix;

    this.state = new Array(this.padCount);
    for (let i = 0; i < this.padCount; i++) {
      this.state[i] = 0;
    }

    this.controller = controller;
  }

  parseInput(data) {
    let offset = 1;
    for (let iRep = 0; iRep < this.repeatCount; iRep++, offset += 3) {
      const index = data[offset];
      const isValid = !!(data[offset + 1] & 0xf0);
      // MSB, LSB
      const pressure = ((data[offset + 1]&0xf) << 8) | (data[offset + 2]);

      //const weirdVal = (data[offset+1]) >> 4;
      //console.log(data.slice(offset, offset+3), pressure, weirdVal);

      // This is the end-of-packet if the index is 0 and not actually the first
      // slot.
      if (index === 0 && iRep !== 0) {
        // It should also be the case that !isValid here.
        break;
      }
      // And it should be the case that isValid here.

      // pad names are 1-based right now.
      const name = this.prefix + (index + 1);
      if (pressure <= PRESS_THRESHOLD) {
        const wasPressed = (this.state[index] > PRESS_THRESHOLD);
        this.state[index] = 0;

        if (wasPressed) {
          this.controller.emit(`${name}:released`, 0);
          this.controller.emit(`${this.prefix}:released`, index, 0)
        }
      } else {
        const firstPress = (this.state[index] <= PRESS_THRESHOLD);
        this.state[index] = pressure;

        if (firstPress) {
          this.controller.emit(`${name}:pressed`, pressure);
          this.controller.emit(`${this.prefix}:pressed`, index, pressure);
        }
      }

      this.controller.emit(`${name}:pressure`, pressure);
      this.controller.emit(`${this.prefix}:pressure`,index,  pressure);
    }
  }
};

module.exports = PacketizedPads;
