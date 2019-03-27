const BaseParser = require('../common/base-parser').BaseParser;
const Promise = require('bluebird');
class ThumbNailParser extends BaseParser{
  constructor(data){
      super();
      this.data = data;
      this.result = {};
  }

  parse(){
      return new Promise((resolve, reject)=>{
          let currentVarName = null;
          let currentVarValue = {
            byteLength: 0,
            data: ''
          };
          Promise.each(this.data, (cursor)=>{
              if(cursor.code === 90){
                  currentVarValue.byteLength = cursor.value;
              }
              if(cursor.code === 310) currentVarValue.data += cursor.value;
              return;
          })
          .then(()=>{
              if(currentVarValue.byteLength > 0) this.result = currentVarValue;
              resolve(this.result);
          })
      });
  }
}

exports.ThumbNailParser = ThumbNailParser;
