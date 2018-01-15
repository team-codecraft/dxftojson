const BaseParser = require('../../common/base-parser').BaseParser;
const Promise = require('bluebird');

class Solid extends BaseParser{
    constructor(){
        super();
    }

    parse(buffer, cursor){
        if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(this.DxfSpec.Entity.Solid.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.Solid[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
    }

    reset(){

    }
}

exports.Solid = Solid;