const BaseParser = require('../../common/base-parser').BaseParser;

class Dimension extends BaseParser{
    constructor(){
        super();
    }

    parse(buffer, cursor){
        if(this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(this.DxfSpec.Entity.Dimension.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.Dimension[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }

        if(buffer.hasOwnProperty('dimensionType')){
            let spec;
            if(buffer['dimensionType'] === 0 && this.DxfSpec.Entity.DimensionLinear.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionLinear[cursor.code];
            } else if(buffer['dimensionType'] === 1 && this.DxfSpec.Entity.DimensionAligned.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionAligned[cursor.code];
            } else if((buffer['dimensionType'] === 2 || buffer['dimensionType'] === 5) && this.DxfSpec.Entity.DimensionAngular.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionAngular[cursor.code];
            } else if((buffer['dimensionType'] === 3 || buffer['dimensionType'] === 4) && this.DxfSpec.Entity.DimensionRadial.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionRadial[cursor.code];
            } else if(buffer['dimensionType'] === 6 && this.DxfSpec.Entity.DimensionOrdinate.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionOrdinate[cursor.code];
            }

            if(typeof spec !== 'undefined') this.matchSpec(buffer, spec, cursor);
        }
    }

    reset(){

    }
}

exports.Dimension = Dimension;