const BaseParser = require('../common/base-parser').BaseParser;
const Promise = require('bluebird');

const LWPolyLine = require('./entity/lwpolyline').LWPolyLine;
const PolyLine = require('./entity/polyline').PolyLine;
const Line = require('./entity/line').Line;
const Text = require('./entity/text').Text;
const MText = require('./entity/mtext').MText;
const ATTDEF = require('./entity/attdef').ATTDEF;
const Circle = require('./entity/circle').Circle;
const Solid = require('./entity/solid').Solid;
const Insert = require('./entity/insert').Insert;
const Ellipse = require('./entity/ellipse').Ellipse;
const Point = require('./entity/point').Point;
const Arc = require('./entity/arc').Arc;
const Dimension = require('./entity/dimension').Dimension;
const Wipeout = require('./entity/wipeout').Wipeout;

class EntitiesParser extends BaseParser{
    constructor(data){
        super();
        this.data = data;
        this.result = [];
        this.entitySupport = {
            'ATTDEF' : { support : true, fn : new ATTDEF() },
            'ARC' : { support : true, fn : new Arc() },
            'CIRCLE' : { support : true, fn : new Circle() },
            'ELLIPSE' : { support : true, fn : new Ellipse() },
            'INSERT' : { support : true, fn : new Insert() },
            'LINE' : { support : true, fn : new Line() },
            'LWPOLYLINE' : { support : true, fn : new LWPolyLine() },
            'MTEXT' : { support : true, fn : new MText() },
            'POINT' : { support : true, fn : new Point() },

            'POLYLINE' : { support : true, fn : new PolyLine() },
            'VERTEX' : { support : false, fn : null },
            'SEQEND' : { support : false, fn : null },

            'SOLID' : { support : true, fn : new Solid() },
            'TEXT' : { support : true, fn : new Text() },

            'DIMENSION' : { support : true, fn : new Dimension() },
            'HATCH' : { support : false, fn : null },
            '3DFACE' : { support : false, fn : null },
            '3DSOLID' : { support : false, fn : null },
            'ATTRIB' : { support : false, fn : null },
            'BODY' : { support : false, fn : null },
            'ACAD_PROXY_ENTITY' : { support : false, fn : null },
            'HELIX' : { support : false, fn : null },
            'IMAGE' : { support : false, fn : null },
            'LEADER' : { support : false, fn : null },
            'LIGHT' : { support : false, fn : null },
            'MESH' : { support : false, fn : null },
            'MLINE' : { support : false, fn : null },
            'MLEADERSTYLE' : { support : false, fn : null },
            'MLEADER' : { support : false, fn : null },
            'OLEFRAME' : { support : false, fn : null },
            'OLE2FRAME' : { support : false, fn : null },
            'RAY' : { support : false, fn : null },
            'REGION' : { support : false, fn : null },
            'SECTION' : { support : false, fn : null },
            'SHAPE' : { support : false, fn : null },
            'SPLINE' : { support : false, fn : null },
            'SUN' : { support : false, fn : null },
            'SURFACE' : { support : false, fn : null },
            'TABLE' : { support : false, fn : null },
            'TOLERANCE' : { support : false, fn : null },
            'TRACE' : { support : false, fn : null },
            'UNDERLAY' : { support : false, fn : null },
            'VIEWPORT' : { support : false, fn : null },
            'WIPEOUT' : { support : true, fn : new Wipeout() },
            'XLINE' : { support : false, fn : null }
        };

        this.restoreFlag = false;
    }

    parse(){
        let entityIdx = -1;
        return Promise.each(this.data, (entities)=>{
            let entityType = entities.type;
            if( this.entitySupport.hasOwnProperty(entityType) ){
                if(this.entitySupport[entityType].support){
                    entityIdx++;
                    this.result[entityIdx] = {type : entities.type};
                } else {
                  // console.log('unsupport type', entityType);
                }
            } else {
              console.log('undefined type', entityType);
            }
            if(this.entitySupport.hasOwnProperty(entityType) && this.entitySupport[entityType].support){
                return Promise.each(entities.data, (cursor)=>{
                    return this.entitySupport[entityType].fn.parse(this.result[entityIdx],cursor);
                }).then(()=>{
                    return this.entitySupport[entityType].fn.reset();
                });
            } else {
                return false;
            }
        }).then(rtn=>{
            return this.result;
        });
    }
}

exports.EntitiesParser = EntitiesParser;
