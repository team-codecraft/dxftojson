const BaseParser = require('../../common/base-parser').BaseParser;
const Promise = require('bluebird');

class PolyLine extends BaseParser{
    constructor(){
        super();
        this.activeVertices = false;
        this.activeIdx = -1;
    }

    parse(buffer, cursor){
        if(cursor.code === 0 && cursor.value === 'VERTEX') {
            this.activeVertices = true;
            this.activeIdx++;
        }

        if(!this.activeVertices && this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(!this.activeVertices && this.DxfSpec.Entity.PolyLine.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.PolyLine[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }

        if(this.activeVertices && (this.DxfSpec.Entity.Vertex.hasOwnProperty(cursor.code) || this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code))){
            if(!buffer.hasOwnProperty('vertices')) buffer['vertices'] = [];
            if(buffer['vertices'].length === this.activeIdx) buffer['vertices'].push({});
            let spec = (this.DxfSpec.Entity.Vertex.hasOwnProperty(cursor.code) ? this.DxfSpec.Entity.Vertex[cursor.code] : this.DxfSpec.Section.Entities[cursor.code]);
            this.matchSpec(buffer['vertices'][this.activeIdx], spec, cursor);
        }
    }

    reset(){
        this.activeVertices = false;
        this.activeIdx = -1;
    }
}

exports.PolyLine = PolyLine;