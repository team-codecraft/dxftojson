const BaseParser = require('../../common/base-parser').BaseParser;

class MLine extends BaseParser{
    constructor(){
        super();
        this.activeVertices = false;
        this.activeIdx = -1;
				this.activeSegment = false;
        this.activeSegmentIdx = -1;
				this.activeMiter = false;
        this.activeMiterIdx = -1;
    }

    parse(buffer, cursor){
        if(!this.activeVertices && this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Section.Entities[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(!this.activeVertices && this.DxfSpec.Entity.MLine.hasOwnProperty(cursor.code)){
            let spec = this.DxfSpec.Entity.MLine[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }
        if(cursor.code === 11) {
            this.activeVertices = true;
            this.activeIdx++;
        }
        if(this.activeVertices && this.DxfSpec.Entity.MLineVertex.hasOwnProperty(cursor.code)){
            if(!buffer.hasOwnProperty('vertices')) buffer['vertices'] = [];
            if(buffer['vertices'].length === this.activeIdx) buffer['vertices'].push({});
            let spec = this.DxfSpec.Entity.MLineVertex[cursor.code];
            this.matchSpec(buffer['vertices'][this.activeIdx], spec, cursor);
        }
				if(cursor.code === 12) {
            this.activeSegment = true;
            this.activeSegmentIdx++;
        }
        if(this.activeSegment && this.DxfSpec.Entity.MLineSegment.hasOwnProperty(cursor.code)){
            if(!buffer.hasOwnProperty('segments')) buffer['segments'] = [];
            if(buffer['segments'].length === this.activeSegmentIdx) buffer['segments'].push({});
            let spec = this.DxfSpec.Entity.MLineSegment[cursor.code];
            this.matchSpec(buffer['segments'][this.activeSegmentIdx], spec, cursor);
        }
				if(cursor.code === 13) {
            this.activeMiter = true;
            this.activeMiterIdx++;
        }
        if(this.activeSegment && this.DxfSpec.Entity.MLineMiter.hasOwnProperty(cursor.code)){
            if(!buffer.hasOwnProperty('miters')) buffer['miters'] = [];
            if(buffer['miters'].length === this.activeMiterIdx) buffer['miters'].push({});
            let spec = this.DxfSpec.Entity.MLineMiter[cursor.code];
            this.matchSpec(buffer['miters'][this.activeMiterIdx], spec, cursor);
        }
    }

		reset(){
			this.activeVertices = false;
			this.activeIdx = -1;
			this.activeSegment = false;
			this.activeSegmentIdx = -1;
			this.activeMiter = false;
			this.activeMiterIdx = -1;
    }
}

exports.MLine = MLine;
