const BaseParser = require('../../common/base-parser').BaseParser;

class ATTDEF extends BaseParser{
    constructor(){
        super();
    }

    parse(buffer, cursor){
        if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(this.DxfSpec.Entity.ATTDEF.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.ATTDEF[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
    }

    reset(){

    }
}

exports.ATTDEF = ATTDEF;