const Promise = require('bluebird');
const EventEmitter = require('events').EventEmitter;

class ObjectGenerator extends EventEmitter{
    constructor(dxfData){
        super();
        this.dxfData = dxfData;
        this.keys = Object.keys(dxfData.blocks);
        this.blockIdx = 0;
    }

    init(){
        return new Promise((resolve, reject)=>{
            this._buildBase(this.dxfData)
                .then((baseInfo) => {
                    this.base = baseInfo.base;
                    this.lineTypes = baseInfo.lineTypes;
                    this.layers = baseInfo.layers;
                    resolve(baseInfo);
                })
        });
    }

    nextBlock(){
        return new Promise((resolve, reject)=>{
            let block = this.dxfData.blocks[this.keys[this.blockIdx++]];
            if(this.blockIdx === this.keys.length ) resolve({done : true});
            else{
                resolve(Promise.props({
                    "done" : false,
                    "handle" : block['handle'],
                    "ownerHandle" : block['ownerHandle'],
                    "layer" : block['layer'],
                    "name" : block['name'],
                    "position" : block['position'],
                    "name2" : block['name2'],
                    "xrefPath" : block['xrefPath'],
                    "entities" : (block.hasOwnProperty('entities') && block.entities.length > 0 ),
                }));
            }
        });
    }


    parseBlocksStream(blockKey){
        return new Promise((resolve)=>{
            this._parse(this.dxfData.blocks[blockKey].entities, true, blockKey)
                .then(()=>{
                    resolve(true);
                })
        });

    }

    parseEntitiesStream(){
        return new Promise((resolve)=>{
            this._parse(this.dxfData.entities)
                .then(()=>{
                    resolve(true);
                })
        });
    }

    _parse(entities, isBlock, key){
        return new Promise((resolve)=>{
            Promise.each(entities,(entity)=>{
                return this._parseEntity(entity)
                    .then((result)=>{
                        if(result){
                            if(isBlock) this.emit( 'parseBlocks',{key : key,data : result});
                            else this.emit('parseEntities',result);
                            return true;
                        } else return false;
                    })
            }).then(()=>{
                resolve(true);
            })
        });
    }

    _parseEntity(entity){
        return new Promise((resolve)=>{
            if(entity.type.match(/LINE|LWPOLYLINE|POLYLINE|SOLID|CIRCLE|ARC|TEXT|MTEXT|INSERT|POINT|DIMENSION|ATTDEF/)){
                if(entity.type === 'LINE') this._line(entity).then(resolve);
                if(entity.type === 'LWPOLYLINE') this._polyLine(entity).then(resolve);
                if(entity.type === 'POLYLINE') this._polyLine(entity).then(resolve);
                if(entity.type === 'CIRCLE') this._circle(entity).then(resolve);
                if(entity.type === 'ARC') this._arc(entity).then(resolve);
                if(entity.type === 'TEXT') this._text(entity).then(resolve);
                if(entity.type === 'MTEXT') this._mtext(entity).then(resolve);
                if(entity.type === 'ATTDEF') this._attdef(entity).then(resolve);
                if(entity.type === 'POINT') this._point(entity).then(resolve);
                if(entity.type === 'SOLID') this._solid(entity).then(resolve);
                if(entity.type === 'INSERT') this._insert(entity).then(resolve);
                if(entity.type === 'DIMENSION') this._dimension(entity).then(resolve);
            } else resolve(false);
        });
    }

    _parseBlock(coreData, entities){
        return new Promise((resolve)=>{
            let blocks = [];
            Promise.each(entities, (entity)=>{
                return this._parseEntity(coreData, entity).then((r)=>{
                    if(r) return blocks.push(r);
                    else return false;
                });
            })
                .then(()=>{
                    resolve(blocks);
                })
        })
    }

    _line(entity){
        return new Promise((resolve)=>{
           this._setEntitiesCommon(entity, 'line')
                .then((r)=>{
                    let line = r;
                    line.x1 = this._getAxisX(entity.vertices[0].x);
                    line.y1 = this._getAxisY(entity.vertices[0].y);
                    line.x2 = this._getAxisX(entity.vertices[1].x);
                    line.y2 = this._getAxisY(entity.vertices[1].y);
                    resolve(line);
                });
        })
    }

    _polyLine(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'polyline')
                .then((r)=>{
                    let polyLine = r;
                    polyLine.shape = !!entity.shape;
                    polyLine.includesCurveFitVertices = !!entity.includesCurveFitVertices;
                    polyLine.includesSplineFitVertices = !!entity.includesSplineFitVertices;
                    polyLine.is3dPolyline = !!entity.is3dPolyline;
                    polyLine.is3dPolygonMesh = !!entity.is3dPolygonMesh;
                    polyLine.is3dPolygonMeshClosed = !!entity.is3dPolygonMeshClosed;
                    polyLine.isPolyfaceMesh = !!entity.isPolyfaceMesh;
                    polyLine.hasContinuousLinetypePattern = !!entity.hasContinuousLinetypePattern;
                    let linearArr = [];
                    return Promise.each(entity.vertices, (vertices)=>{
                        return linearArr.push([this._getAxisX(vertices.x),this._getAxisY(vertices.y)].join(','));
                        // return linearArr.push({
                        //     x : this._getAxisX(vertices.x),
                        //     y : this._getAxisY(vertices.y)
                        // });
                    }).then(()=>{
                        if(entity.shape) linearArr.push(linearArr[0]);
                        polyLine.vertices = linearArr.join(' ');
                        return polyLine
                    }).then((polyLine)=>{
                        resolve(polyLine);
                    })
                });
        })
    }

    _circle(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'circle')
                .then((r)=>{
                    let circle = r;
                    circle.center = {
                        x : this._getAxisX(entity.center.x),
                        y : this._getAxisY(entity.center.y),
                        z : entity.center.z
                    };
                    circle.radius = entity.radius;
                    resolve(circle);
                });
        })
    }

    _arc(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'arc')
                .then((r)=>{
                    let arc = r;
                    arc.center = {
                        x : this._getAxisX(entity.center.x),
                        y : this._getAxisY(entity.center.y),
                        z : entity.z
                    };
                    arc.radius = entity.radius;
                    arc.endAngle = entity.endAngle;
                    arc.startAngle = entity.startAngle;
                    arc.angleLength = entity.angleLength;
                    resolve(arc);
                });
        })
    }

    _text(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'text')
                .then((r)=>{
                    let text = r;
                    text.text = entity.text;
                    text.startPoint = {
                        x : this._getAxisX(entity.startPoint.x),
                        y : this._getAxisY(entity.startPoint.y),
                        z : entity.startPoint.z,
                    };
                    if(typeof entity.endPoint !== 'undefined'){
                        text.endPoint = {
                            x : this._getAxisX(entity.endPoint.x),
                            y : this._getAxisY(entity.endPoint.y),
                            z : entity.endPoint.z,
                        };

                        text.middle = {
                            x : Math.ceil(entity.endPoint.x - entity.startPoint.x)/2,
                            y : Math.ceil(entity.startPoint.y - entity.endPoint.y)/2,
                        };
                    }

                    text.textHeight = Math.abs(entity.textHeight);
                    text.halign = entity.halign;
                    text.valign = entity.valign;
                    text.xScale = entity.xScale;
                    text.rotation = entity.rotation;
                    resolve(text);
                });
        })
    }

    _mtext(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'mtext')
                .then((r)=>{
                    let mtext = r;
                    mtext.text = entity.text;
                    mtext.position = {
                        x : this._getAxisX(entity.position.x),
                        y : this._getAxisY(entity.position.y),
                        z : entity.position.z,
                    };

                    mtext.textHeight =  Math.abs(entity.textHeight);
                    mtext.xScale = entity.xScale;
                    mtext.rotation = entity.rotation;
                    if(typeof entity.attachmentPoint !== 'undefined') mtext.attachmentPoint = entity.attachmentPoint;
                    if(typeof entity.drawingDirection !== 'undefined') mtext.drawingDirection = entity.drawingDirection;
                    resolve(mtext);
                });
        })
    }

    _point(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'point')
                .then((r)=>{
                    let point = r;
                    point.position = {
                        x : this._getAxisX(entity.position.x),
                        y : this._getAxisY(entity.position.y),
                        z : entity.position.z,
                    };
                    resolve(point);
                });
        })
    }

    _insert(entity){
        return new Promise((resolve)=>{
            if(this.dxfData.blocks.hasOwnProperty(entity.name) && (!this.dxfData.blocks[entity.name].hasOwnProperty('xrefPath') || this.dxfData.blocks[entity.name]['xrefPath'] === '' )){
                this._setEntitiesCommon(entity, 'insert')
                    .then((r)=>{
                        let insert = r;
                        insert.name = entity.name;
                        insert.position = {
                            x : this._getAxisX(entity.position.x),
                            y : this._getAxisY(entity.position.y),
                            z : entity.position.z,
                        };
                        if(entity.hasOwnProperty('scale')){
                            insert.scale = entity.scale;
                        }
                        if(typeof entity.rotation !== 'undefined') insert.rotation = entity.rotation;
                        if(typeof entity.columnCount !== 'undefined') insert.columnCount = entity.columnCount;
                        if(typeof entity.rowCount !== 'undefined') insert.rowCount = entity.rowCount;
                        if(typeof entity.columnSpacing !== 'undefined') insert.columnSpacing = entity.columnSpacing;
                        if(typeof entity.rowSpacing !== 'undefined') insert.rowSpacing =entity.rowSpacing;
                        if(typeof entity.attributeFlow !== 'undefined') insert.attributeFlow = entity.attributeFlow;
                        insert.entities = [];
                        return Promise.each(this.dxfData.blocks[entity.name].entities, (entity)=>{
                            return this._parseEntity(entity)
                                .then((r)=>{
                                    if(r) insert.entities.push(r);
                                    else return false;
                                })
                        }).then(()=>{
                            return insert;
                        })
                }).then((insert)=>{
                    resolve(insert);
                })
            } else {
                resolve(false);
            }
        })
    }

    _dimension(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'dimension')
                .then((r)=>{
                    let dimension = r;
                    dimension.anchorPoint ={
                        x : this._getAxisX(entity.anchorPoint.x),
                        y : this._getAxisY(entity.anchorPoint.y),
                        z : entity.anchorPoint.z,
                    };
                    dimension.middleOfText = {
                        x : this._getAxisX(entity.middleOfText.x),
                        y : this._getAxisY(entity.middleOfText.y),
                        z : entity.middleOfText.z,
                    };
                    dimension.text = entity.text;
                    dimension.actualMeasurement = Number.isNaN(parseFloat(entity.actualMeasurement)) ? 0 : parseFloat(entity.actualMeasurement);
                    dimension.attachmentPoint = entity.attachmentPoint;
                    dimension.dimensionType = entity.dimensionType;
                    if(entity.hasOwnProperty('angle')) dimension.angle = entity.angle;
                    dimension.entities = [];
                    return Promise.each(this.dxfData.blocks[entity.block].entities, (entity)=>{
                        return this._parseEntity(entity)
                            .then((r)=>{
                                if(r)  dimension.entities.push(r);
                                else return false;
                            })
                    }).then(()=>{
                        return dimension;
                    })
            }).then((dimension)=>{
                resolve(dimension);
            })
        })
    }

    _solid(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'solid')
                .then((r)=>{
                    let solid = r;
                    let points = [];
                    Promise.each(entity.points, (vertices)=>{
                        return points.push([this._getAxisX(vertices.x),this._getAxisY(vertices.y)].join(','))
                        // return points.push({
                        //     x : this._getAxisX(vertices.x),
                        //     y : this._getAxisY(vertices.y),
                        //     z : vertices.z
                        // });
                    }).then(()=>{
                        solid.points = points.join(' ');
                        resolve(solid);
                    })
                });
        })
    }

    _attdef(entity){
        return new Promise((resolve)=>{
            this._setEntitiesCommon(entity, 'attdef')
                .then((r)=>{
                    let attDef = r;
                    attDef.startPoint = {
                        x : this._getAxisX(entity.startPoint.x),
                        y : this._getAxisY(entity.startPoint.y),
                        z : entity.startPoint.z,
                    };
                    if(typeof entity.endPoint !== 'undefined'){
                        attDef.endPoint = {
                            x : this._getAxisX(entity.endPoint.x),
                            y : this._getAxisY(entity.endPoint.y),
                            z : entity.endPoint.z,
                        };

                        attDef.middle = {
                            x : Math.ceil(entity.endPoint.x - entity.startPoint.x)/2,
                            y : Math.ceil(entity.startPoint.y - entity.endPoint.y)/2,
                        };
                    }

                    attDef.halign = entity.halign;
                    attDef.valign = entity.valign;
                    attDef.text = entity.text;
                    if(typeof entity.textHeight !== 'undefined') attDef.textHeight = Math.abs(entity.textHeight);
                    if(typeof entity.rotation !== 'undefined') attDef.rotation = entity.rotation;
                    if(typeof entity.obliqueAngle !== 'undefined') attDef.obliqueAngle = entity.obliqueAngle;
                    if(typeof entity.scale !== 'undefined') attDef.scale = entity.scale;
                    if(typeof entity.thickness !== 'undefined') attDef.thickness = entity.thickness;
                    resolve(attDef);
                });
        })
    }


    _getAxisX(x){
        return (Math.abs(this.base.extentsMin.x) + parseFloat(x)).toFixed(10);
    }

    _getAxisY(y){
        return (Math.abs(this.base.extentsMax.y) + parseFloat(y)*-1).toFixed(10);
    }

    _getBaseAxis(header){
        return new Promise((resolve)=>{
            let extentsBase = {
                x : header['$EXTMAX']['x'] + header['$EXTMIN']['x']*-1,
                y : (header['$EXTMIN']['y'] - header['$EXTMAX']['y'])*-1
            };
            let traceWidth = Number(header['$TRACEWID']);
            resolve(Promise.props({
                traceWidth : traceWidth,
                extentsMin : header['$EXTMIN'],
                extentsMax : header['$EXTMAX'],
                extentsBase : extentsBase,
                svgWidth :  extentsBase.x * traceWidth,
                svgHeight : extentsBase.y * traceWidth,
                viewBox : [
                    0,
                    0,
                    extentsBase.x,
                    extentsBase.y
                ],
                insBase : header['$INSBASE']
            }));
        });
    }

    _buildLineTypes(ltScale, ltypes){
        return new Promise((resolve)=>{
            let keys = Object.keys(ltypes);
            let dashLines = {};
            Promise.each(keys, (key)=>{
                if(typeof ltypes[key] === 'string' || !ltypes[key].hasOwnProperty('pattern')) return false;
                else return Promise.reduce(ltypes[key]['patternType'], (total, typeValue)=>{ return total + typeValue},0)
                    .then((total)=>{
                        if(total > 0) return false;
                        else{
                            let dashArray = [];
                            return Promise.each(ltypes[key]['pattern'],(patternVal)=>{
                                return dashArray.push(ltScale * Math.abs(patternVal));
                            })
                                .then(()=>{
                                    if(dashArray.length > 0) dashLines[key] = dashArray;
                                    return dashArray;
                                })
                        }
                    })
            }).then(()=>{
                resolve(dashLines);
            })
        });
    }

    _setEntitiesCommon(sourceEntity, type){
        return new Promise((resolve)=>{
            let targetEntity = { type : type };
            if(sourceEntity.hasOwnProperty('handle')) targetEntity.handle = sourceEntity.handle;
            if(sourceEntity.hasOwnProperty('layer')) targetEntity.layer = sourceEntity.layer;
            if(sourceEntity.hasOwnProperty('lineType')) targetEntity.lineType = sourceEntity.lineType;
            if(sourceEntity.hasOwnProperty('lineTypeScale')) targetEntity.lineTypeScale = sourceEntity.lineTypeScale;
            if(sourceEntity.hasOwnProperty('visible')) targetEntity.visible = sourceEntity.visible;
            if(sourceEntity.hasOwnProperty('color')) targetEntity.color = sourceEntity.color;
            if(!sourceEntity.hasOwnProperty('color') && sourceEntity.hasOwnProperty('layer') && this.layers.hasOwnProperty(sourceEntity.layer)) targetEntity.color = this.layers[sourceEntity.layer].color;
            if(sourceEntity.hasOwnProperty('colorIndex')) targetEntity.colorIndex = sourceEntity.colorIndex;
            if(sourceEntity.hasOwnProperty('inPaperSpace')) targetEntity.inPaperSpace = sourceEntity.inPaperSpace;
            if(sourceEntity.hasOwnProperty('ownerHandle')) targetEntity.ownerHandle = sourceEntity.ownerHandle;
            if(sourceEntity.hasOwnProperty('materialObjectHandle')) targetEntity.materialObjectHandle = sourceEntity.materialObjectHandle;
            if(sourceEntity.hasOwnProperty('lineWeight')) targetEntity.lineWeight = sourceEntity.lineWeight;
            if(sourceEntity.hasOwnProperty('trueColor')) targetEntity.trueColor = sourceEntity.trueColor;
            if(sourceEntity.hasOwnProperty('extrusionDirection')) targetEntity.extrusionDirection = {
                x : this._getAxisX(sourceEntity.extrusionDirection.x),
                y : this._getAxisY(sourceEntity.extrusionDirection.y),
                z : sourceEntity.extrusionDirection.z
            };

            let lineTypeScale =  sourceEntity.hasOwnProperty('lineTypeScale') && sourceEntity.lineTypeScale !== 0 ? sourceEntity.lineTypeScale : 1;
            let ltypes;
            if(sourceEntity.hasOwnProperty('lineType') && this.lineTypes.hasOwnProperty(sourceEntity.lineType)) ltypes = this.lineTypes[sourceEntity.lineType];
            if(!sourceEntity.hasOwnProperty('lineType') &&
                this.layers.hasOwnProperty(sourceEntity.layer) &&
                this.layers[sourceEntity.layer].hasOwnProperty('ltype') &&
                this.lineTypes.hasOwnProperty(this.layers[sourceEntity.layer].ltype)) ltypes = this.lineTypes[this.layers[sourceEntity.layer].ltype];

            if(typeof ltypes !== 'undefined' && ltypes.length > 0){
                if(lineTypeScale === 0 || lineTypeScale === 1){
                    targetEntity.strokeDasharray = ltypes;
                    resolve(targetEntity);
                } else {
                    let ltypeBuffer = [];
                    Promise.each(ltypes, (value)=>{ return ltypeBuffer.push(value * lineTypeScale)})
                        .then(()=>{
                            targetEntity.strokeDasharray = ltypeBuffer;
                            resolve(targetEntity);
                        })
                }
            } else {
                resolve(targetEntity);
            }
        });

    }

    _buildBase(dxfData){
        return new Promise((resolve)=>{
            resolve(Promise.props({
                base : this._getBaseAxis(dxfData.header).then(r=>r),
                lineTypes : this._buildLineTypes(dxfData.header['$LTSCALE'],dxfData.tables.ltype).then(r=>r),
                layers : dxfData.tables.layer
            }));
        });
    }
}

exports.ObjectGenerator = ObjectGenerator;