'use strict';

const BaseController = require('./base_controller');

const mk3Config = require('./maschine_mk3_config.json');

class MaschineMk3 extends BaseController {
	constructor() {
		super(mk3Config);
	}
}

module.exports = MaschineMk3;
