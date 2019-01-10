const BaseParser = require('../../common/base-parser').BaseParser;

class LWPolyLine extends BaseParser{
    constructor(){
        super();
        this.activeVertices = false;
        this.activeIdx = -1;
    }

    parse(buffer, cursor){
        if(!this.activeVertices && this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(!this.activeVertices && this.DxfSpec.Entity.LWPolyLine.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.LWPolyLine[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(cursor.code === 10) {
            this.activeVertices = true;
            this.activeIdx++;
        }
        if(this.activeVertices && this.DxfSpec.Entity.LWPolyLineVertices.hasOwnProperty(cursor.code)){
            if(!buffer.hasOwnProperty('vertices')) buffer['vertices'] = [];
            if(buffer['vertices'].length === this.activeIdx) buffer['vertices'].push({});
            let spec = this.DxfSpec.Entity.LWPolyLineVertices[cursor.code];
            this.matchSpec(buffer['vertices'][this.activeIdx], spec, cursor);
        }
    }

    reset(){
        this.activeVertices = false;
        this.activeIdx = -1;
    }
}

exports.LWPolyLine = LWPolyLine;
