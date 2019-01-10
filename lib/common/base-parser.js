const DxfSpec = require('./spec').DxfSpec;
const ColorIndex = require('./color-index');
/**
* 해당 그룹핑 규격은 2018년 DXF 문서를 기준으로 한다.
* */
class BaseParser{
    constructor(){
        this.DxfSpec = DxfSpec;
    }

    matchSpec(target, spec, cursor){
        if(spec.parse){
            if(spec.type === 'KV') target[spec.key] = cursor.value;
            if(spec.type === 'KV_APPEND' ) target[spec.key] += cursor.value;
            if(spec.type === 'POINT'){
                if(!target.hasOwnProperty(spec.key)) target[spec.key] ={};
                target[spec.key][spec.propName] = cursor.value;
            }

            if(spec.type === 'TEXT' || spec.type === 'TEXT_APPEND'){
                let text= cursor.value;
                if(text.match(/(^{(\\f|\\H)[^;]+;.+}$)/g)) text = text.substring(1, text.length -1);
                text = text.replace(/(\\f|\\H)[^;]+;/g,"").replace(/\\A1;/g,"");
                if(spec.type === 'TEXT') target[spec.key] = text;
                else target[spec.key] += text;
            }

            if(spec.type === 'POINT_DUAL'){
                if(!target.hasOwnProperty(spec.key)) target[spec.key] =[];
                if(target[spec.key].length === 0 ){
                    target[spec.key].push({});
                    target[spec.key].push({});
                }
                if(target[spec.key].length === 1 ) target[spec.key].push({});
                target[spec.key][spec.index][spec.propName] = cursor.value;
            }
            if(spec.type === 'POINT_SOLID'){
                if(!target.hasOwnProperty(spec.key)) target[spec.key] =[];
                if(target[spec.key].length === 0 ){
                    target[spec.key].push({});
                    target[spec.key].push({});
                    target[spec.key].push({});
                    target[spec.key].push({});
                }
                if(target[spec.key].length === 1 ){
                    target[spec.key].push({});
                    target[spec.key].push({});
                    target[spec.key].push({});
                }
                if(target[spec.key].length === 2 ){
                    target[spec.key].push({});
                    target[spec.key].push({});
                }
                if(target[spec.key].length === 3 ) target[spec.key].push({});
                target[spec.key][spec.index][spec.propName] = cursor.value;
            }
            if(spec.type === 'K'){
                if(spec.valueType === 'LIST') target[spec.key] = [];
            }
            if(spec.type === 'V'){
                if(spec.valueType === 'LIST') {
                  if (typeof target[spec.key] === 'undefined') target[spec.key] = [];
                  target[spec.key].push(cursor.value);
                }
            }
            if(spec.type === 'COLOR_IDX') target[spec.key] = ColorIndex[Math.abs(cursor.value)];
            if(spec.type === 'BOOLEAN'){
                if(spec.condition.type === 'EQ'){
                    target[spec.key] = cursor.value === spec.condition.diffValue;
                }
                if(spec.condition.type === 'NEQ'){
                    target[spec.key] = cursor.value !== spec.condition.diffValue;
                }
                if(spec.condition.type === 'LTEQ'){
                    target[spec.key] = cursor.value <= spec.condition.diffValue;
                }
            }
            if(spec.type === 'BOOLEAN_VAL'){
                if(spec.condition.type === 'NEQ'){
                    if (cursor.value !== spec.condition.diffValue) target[spec.key] = cursor.value;
                }
            }

            if(spec.type === 'BIT_AND'){
                if(spec.condition.type === 'EQ'){
                    target[spec.key] = (cursor.value & spec.condition.bitValue) === spec.condition.diffValue;
                }
            }

            if(spec.type === 'MULTIPLE'){
                for(let idx in spec.specs) this.matchSpec(target, spec.specs[idx], cursor);
            }
        }
    }
}

exports.BaseParser = BaseParser;
