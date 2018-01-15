const BaseParser = require('../../common/base-parser').BaseParser;

class Ellipse extends BaseParser{
    constructor(){
        super();
    }

    parse(buffer, cursor){
        if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(this.DxfSpec.Entity.Ellipse.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.Ellipse[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
    }

    reset(){

    }
}

exports.Ellipse = Ellipse;