const BaseParser = require('../common/base-parser').BaseParser;
const Promise = require('bluebird');

class HeaderParser extends BaseParser{
    constructor(data){
        super();
        this.data = data;
        this.result = {};
    }

    parse(){
        return new Promise((resolve, reject)=>{
            let currentVarName = null;
            let currentVarValue = null;
            Promise.each(this.data, (cursor)=>{
                if(cursor.code === 9){
                    if(typeof currentVarName === 'string') this.result[currentVarName] = currentVarValue;
                    currentVarName = cursor.value;
                }
                if(cursor.code === 10) currentVarValue = { x : cursor.value };
                else if(cursor.code === 20) currentVarValue['y'] = cursor.value;
                else if(cursor.code === 30) currentVarValue['z'] = cursor.value;
                else currentVarValue = cursor.value;
                return;
            })
            .then(()=>{
                if(typeof currentVarName === 'string') this.result[currentVarName] = currentVarValue;
                resolve(this.result);
            })
        });
    }
}

exports.HeaderParser = HeaderParser;