const BaseParser = require('../../common/base-parser').BaseParser;

class MText extends BaseParser{
    constructor(){
        super();
    }

    parse(buffer, cursor){

        if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(this.DxfSpec.Entity.MText.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.MText[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
    }

    reset(){

    }
}

exports.MText = MText;