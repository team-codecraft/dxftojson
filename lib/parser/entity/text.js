const BaseParser = require('../../common/base-parser').BaseParser;
const Promise = require('bluebird');

class Text extends BaseParser{
    constructor(){
        super();
    }

    parse(buffer, cursor){

        if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(this.DxfSpec.Entity.Text.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.Text[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
    }

    reset(){

    }
}

exports.Text = Text;