const BaseParser = require('../common/base-parser').BaseParser;
const Promise = require('bluebird');

class TablesParser extends BaseParser{
    constructor(data){
        super();
        this.data = data;
        this.result = {};
    }

    parse(){
        return new Promise((resolve, result)=>{
            resolve(Promise.props({
                vport : this.parseVport(this.data.vport).then(result=>result),
                ltype : this.parseLtype(this.data.ltype).then(result=>result),
                layer : this.parseLayer(this.data.layer).then(result=>result)
            }));
        });
    }

    parseVport(data){
        let activeIdx = -1;
        let vport = {};
        return new Promise((resolve, result)=>{
            Promise.each(data, (cursor)=>{
                if(cursor.code === 0 && cursor.value === 'VPORT') activeIdx++;
                if(activeIdx < 0 && this.DxfSpec.Section.Tables.hasOwnProperty(cursor.code)){
                    let spec = this.DxfSpec.Section.Tables[cursor.code];
                    this.matchSpec(vport, spec, cursor);
                }
                if(activeIdx >= 0 && this.DxfSpec.Table.Vport.hasOwnProperty(cursor.code)){
                    if(!vport.hasOwnProperty('vports')) vport['vports'] = [];
                    if(vport['vports'].length === activeIdx ) vport['vports'].push({});
                    let spec = this.DxfSpec.Table.Vport[cursor.code];
                    this.matchSpec(vport['vports'][activeIdx], spec, cursor);
                }
                return cursor;
            }).then(()=>{
                resolve(vport);
            })
        });
    }

    parseLtype(data){
        let activeIdx = -1;
        let ltype = {};
        let ltypeBuffer;
        return new Promise((resolve, result)=>{
           Promise.each(data, (cursor)=>{
               if(cursor.code === 0 && cursor.value === 'LTYPE'){
                   if(activeIdx >= 0 && typeof ltypeBuffer !== 'undefined') ltype[ltypeBuffer.name] = ltypeBuffer;
                   ltypeBuffer = {};
                   activeIdx++;
               }
               if(activeIdx < 0 && this.DxfSpec.Section.Tables.hasOwnProperty(cursor.code)){
                   let spec = this.DxfSpec.Section.Tables[cursor.code];
                   this.matchSpec(ltype, spec, cursor);
               }
               if(activeIdx >= 0 && this.DxfSpec.Table.Ltype.hasOwnProperty(cursor.code)){
                   let spec = this.DxfSpec.Table.Ltype[cursor.code];
                   this.matchSpec(ltypeBuffer, spec, cursor);
               }

           }).then(()=>{
               if(ltypeBuffer.hasOwnProperty('name')) ltype[ltypeBuffer.name] = ltypeBuffer;
               resolve(ltype)
           })
        });
    }

    parseLayer(data){
        let activeIdx = -1;
        let layer = {};
        let layerBuffer;
        return new Promise((resolve, result)=>{
            Promise.each(data, (cursor)=>{
                if(cursor.code === 0 && cursor.value === 'LAYER'){
                    if(activeIdx >= 0 && typeof layerBuffer !== 'undefined') layer[layerBuffer.name] = layerBuffer;
                    layerBuffer = {};
                    activeIdx++;
                }
                if(activeIdx < 0 && this.DxfSpec.Section.Tables.hasOwnProperty(cursor.code)){
                    let spec = this.DxfSpec.Section.Tables[cursor.code];
                    this.matchSpec(layer, spec, cursor);
                }
                if(activeIdx >= 0 && this.DxfSpec.Table.Layer.hasOwnProperty(cursor.code)){
                    let spec = this.DxfSpec.Table.Layer[cursor.code];
                    this.matchSpec(layerBuffer, spec, cursor);
                }
                // console.log(layerBuffer);
                return cursor;
            }).then(()=>{

                if(layerBuffer.hasOwnProperty('name')) layer[layerBuffer.name] = layerBuffer;
                resolve(layer)
            })
        });
    }


}

exports.TablesParser = TablesParser;
