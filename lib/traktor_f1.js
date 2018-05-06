'use strict';

const BaseController = require('./base_controller');

const f1Config = require('./traktor_f1_config.json');

class TraktorF1 extends BaseController {
	constructor() {
		super(f1Config);
	}
}

module.exports.TraktorF1 = TraktorF1;
