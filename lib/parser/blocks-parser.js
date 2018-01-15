const BaseParser = require('../common/base-parser').BaseParser;
const Promise = require('bluebird');
const EntitiesParser = require('./entities-parser').EntitiesParser;

class BlocksParser extends BaseParser{
    constructor(data){
        super();
        this.data = data;
        this.result = {};
    }

    parse() {
        return new Promise((resolve, reject)=>{
            Promise.each(this.data, (blockData)=>{
                let blockBuffer = {};
                return Promise.each(blockData.block, (cursor)=>{
                    if(this.DxfSpec.Section.Blocks.hasOwnProperty(cursor.code)){
                        let spec = this.DxfSpec.Section.Blocks[cursor.code];
                        this.matchSpec(blockBuffer, spec, cursor);
                    }
                    return cursor;
                }).then(()=>{
                    this.result[blockBuffer.name] = blockBuffer;
                    return blockData.entities.length > 0 ?
                        new EntitiesParser(blockData.entities).parse().then((result)=>{
                            this.result[blockBuffer.name].entities = result;
                        }) : false;
                });
            }).then(()=>{
                resolve(this.result);
            })
        });
    }
}

exports.BlocksParser = BlocksParser;