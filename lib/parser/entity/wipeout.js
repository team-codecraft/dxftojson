const BaseParser = require('../../common/base-parser').BaseParser;
const Promise = require('bluebird');

class Wipeout extends BaseParser{
	constructor(){
		super();
		this.brightness = 50;
		this.contrast = 50;
		this.fade = 0;
	}

	parse(buffer, cursor){
		if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
			let spec = this.DxfSpec.Section.Entities[cursor.code];
			this.matchSpec(buffer, spec, cursor);
		} else if (this.DxfSpec.Entity.Wipeout.hasOwnProperty(cursor.code)) {
			let spec = this.DxfSpec.Entity.Wipeout[cursor.code];
			this.matchSpec(buffer, spec, cursor);
		} else {
			// console.log(cursor);
		}
	}

	reset(){
		this.brightness = 50;
		this.contrast = 50;
		this.fade = 0;
	}
}

exports.Wipeout = Wipeout;
