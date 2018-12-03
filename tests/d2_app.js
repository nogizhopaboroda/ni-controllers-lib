const D2 = require('../lib/traktor_d2');

// Let's reuse as much of the app as possible...
const f1 = new D2();

var tinycolor = require('tinycolor2');
var _ = require('lodash');

var rows = 2;
var cols = 4;

var layers = [];

var Layer = function() {
	this.active = false;
	this.editing = false;
	this.brightness = 0;

	this.colors = [];
	this.timing = {};
	this.effect = function() {};
	this.group = {};
};

Layer.prototype.isActive = function() {
	return this.active && !!this.brightness;
}

var userLayer = 0;


f1.on('shift:pressed', function(e) {
	setUserLayer(0);
});
f1.on('sync:pressed', function(e) {
	setUserLayer(1);
});
f1.on('cue:pressed', function(e) {
	setUserLayer(2);
});
f1.on('play:pressed', function(e) {
	setUserLayer(3);
});

var setUserLayer = function(layerNum) {
	f1.setLED('shift', layerNum === 0 ? 1.0 : 0);
	f1.setLED('syncGreen', layerNum === 1 ? 1.0 : 0);
	f1.setLED('cue', layerNum === 2 ? 1.0 : 0);
	f1.setLED('play', layerNum === 3 ? 1.0 : 0);
};

var bpm = 128;

var current = 0;

var bpmChanged = false;
f1.on('stepper:step',function(e) {
	if(e.direction == 1) {
		bpm++;
	}
	else {
		bpm--;
	}
	bpmChanged = true;
});


//f1.setRGB('p1',0,1,0);

var count = 0;

var hue=0, sat=0, val=0, dist = 1;

var setRGBsToCanvas = function() {
	/*var pixels = ctx.getImageData(0,0,4,4).data;
	console.log(pixels);
	for(var i=0; i<16; i++) {
		var pixIndex = i*4;
		var alpha = pixels[pixIndex+3]/255;
		f1.setRGB('p'+(i+1),alpha*pixels[pixIndex],alpha*pixels[pixIndex+1],alpha*pixels[pixIndex+2]);
	}*/
};


var setAllRGBs = function() {
	for(var a=1; a<=8; a++)
		f1.setRGB('p'+a,0,0,0);
	var colors = tinycolor({h:hue,s:sat,v:val}).analogous(17,dist);
	for(var a=0, b=1; a < 8; a++, b = (b+1)%colors.length) {
		//var c = (Math.floor(a/4)+b)%4;
		var c = b;
		f1.setRGB('p'+(a+1),colors[c]._r,colors[c]._g,colors[c]._b);
	}
};

f1.on('s1:changed',function(e) {
	hue = e.value*360;
	setAllRGBs();
});

f1.on('s2:changed',function(e) {
	sat = e.value;
	setAllRGBs();
});

f1.on('s3:changed',function(e) {
	val = e.value;
	setAllRGBs();
});

f1.on('s4:changed',function(e) {
	dist = Math.floor(e.value*100)+1;
	setAllRGBs();
});

Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}
