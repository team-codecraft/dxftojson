const BaseParser = require('../../common/base-parser').BaseParser;

class Hatch extends BaseParser{
    constructor() {
        super();
        this.polyEdge = false;
        this.activeHatch = false;
        this.activeEdge = false;
        this.edgeType = '';
        this.edgeIdx = -1;
        this.edgeCnt = 0;
    }

    parse(buffer, cursor){
        if(!this.activeHatch && this.DxfSpec.Entity.Hatch.hasOwnProperty(cursor.code)){
            if(cursor.code === 91) this.activeHatch = true;
            let spec = this.DxfSpec.Entity.Hatch[cursor.code];
            this.matchSpec(buffer, spec, cursor);
        }

        if(this.activeHatch){
            if(!this.polyEdge && cursor.code === 72 ){
                this.edgeIdx++;
                this.edgeCnt--;
                this.activeEdge = true;
                this.edgeType = cursor.value === 1 ? 'linear' : cursor.value === 2 ? 'arc' : cursor.value === 3 ? 'ellipsis' : cursor.value === 4 ? 'spline' : '';
            }

            if(!this.activeEdge && this.DxfSpec.Entity.HatchEdge.hasOwnProperty(cursor.code)){
                // 0 = 기본값
                // 1 = 외부
                // 2 = 폴리선
                // 4 = 파생
                // 8 = 문자 상자
                // 16 = 최외곽
                if(cursor.code === 92 ){
                    this.polyEdge = ((cursor.value & 2) === 2);
                }
                if(cursor.code === 93) this.edgeCnt = cursor.value;

                let spec = this.DxfSpec.Entity.HatchEdge[cursor.code];
                this.matchSpec(buffer, spec, cursor);
            }

            if(this.activeEdge && this.edgeCnt >= 0){
                if(this.edgeType === 'linear'){

                }

                if(this.edgeType === 'arc'){

                }

                if(this.edgeType === 'ellipsis'){

                }

                if(this.edgeType === 'spline'){

                }
            }



        }


        // if(!this.activeVertices && this.DxfSpec.Section.Entities.hasOwnProperty(cursor.code)){
        //     let spec = this.DxfSpec.Section.Entities[cursor.code];
        //     this.matchSpec(buffer, spec, cursor);
        // }
        // if(!this.activeVertices && this.DxfSpec.Entity.LWPolyLine.hasOwnProperty(cursor.code)){
        //     let spec = this.DxfSpec.Entity.LWPolyLine[cursor.code];
        //     this.matchSpec(buffer, spec, cursor);
        // }
        // if(cursor.code === 10) {
        //     this.activeVertices = true;
        //     this.activeIdx++;
        // }
        // if(this.activeVertices && this.DxfSpec.Entity.LWPolyLineVertices.hasOwnProperty(cursor.code)){
        //     if(!buffer.hasOwnProperty('vertices')) buffer['vertices'] = [];
        //     if(buffer['vertices'].length === this.activeIdx) buffer['vertices'].push({});
        //     let spec = this.DxfSpec.Entity.LWPolyLineVertices[cursor.code];
        //     this.matchSpec(buffer['vertices'][this.activeIdx], spec, cursor);
        // }
    }

    reset(){
        this.activeHatch = false;
    }
}

exports.Hatch = Hatch;