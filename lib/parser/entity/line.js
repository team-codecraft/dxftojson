const BaseParser = require('../../common/base-parser').BaseParser;

class Line extends BaseParser{
    constructor(){
        super();
    }

    parse(buffer, cursor){
        if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(this.DxfSpec.Entity.Line.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.Line[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
    }

    reset(){

    }
}

exports.Line = Line;