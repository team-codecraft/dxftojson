const BaseParser = require('../../common/base-parser').BaseParser;
const bitwise = require('bitwise');

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
            let bits = bitwise.byte.read(buffer['dimensionType']);
            let dimensionType = bitwise.byte.write(bitwise.bits.and(bits, [0,0,0,0,1,1,1,1])); //4비트만 연산할수있게 정리
            /* 
                0 = DimensionLinear 
                1 = DimensionAligned
                2 = DimensionAngular
                3 = DimensionRadial
                4 = DimensionRadial
                5 = DimensionAngular
                6 = DimensionOrdinate
            */
            if(dimensionType === 0 && this.DxfSpec.Entity.DimensionLinear.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionLinear[cursor.code];
            } else if(dimensionType === 1 && this.DxfSpec.Entity.DimensionAligned.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionAligned[cursor.code];
            } else if((dimensionType === 2 || dimensionType === 5) && this.DxfSpec.Entity.DimensionAngular.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionAngular[cursor.code];
            } else if((dimensionType === 3 || dimensionType === 4) && this.DxfSpec.Entity.DimensionRadial.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionRadial[cursor.code];
            } else if(dimensionType === 6 && this.DxfSpec.Entity.DimensionOrdinate.hasOwnProperty(cursor.code)){
                spec = this.DxfSpec.Entity.DimensionOrdinate[cursor.code];
            }

            if(typeof spec !== 'undefined') this.matchSpec(buffer, spec, cursor);
        } else {
            let spec;
            spec = this.DxfSpec.Entity.DimensionAligned[cursor.code];
            if(typeof spec !== 'undefined') this.matchSpec(buffer, spec, cursor);
        }


    }

    reset(){

    }
}

exports.Dimension = Dimension;