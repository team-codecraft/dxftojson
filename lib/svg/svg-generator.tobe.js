const Promise = require('bluebird');

const drawSvg = {
    _getAxisX : (coreData, x) => Math.abs(coreData.base.extentsMin.x) + parseFloat(x),
    _getAxisY : (coreData, y) => Math.abs(coreData.base.extentsMax.y) + parseFloat(y)*-1,
    _encode : (str) => {
        let buf = [];
        for (let i=str.length-1;i>=0;i--) {
            buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
        }
        return buf.join('');
    },
    _getBaseAxis : (header) => new Promise((resolve, reject)=>{
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
                // header['$EXTMIN']['x'],
                // (parseFloat(header['$EXTMIN']['y'])*-1)- extentsBase.y,
                0,
                0,
                extentsBase.x,
                extentsBase.y
            ],
            insBase : header['$INSBASE']
        }));
    }),
    _getColorIdx : (coreData, entity) =>{
        if( entity.hasOwnProperty('color')){
            return drawSvg._getRGBAttr(entity.color);
        } else if(entity.hasOwnProperty('layer') && coreData.rawData.tables.layer.hasOwnProperty(entity.layer)){
            return drawSvg._getRGBAttr(coreData.rawData.tables.layer[entity.layer].color);
        } else {
            return false;
        }
    },
    _buildDashArray : (ltScale, ltypes) => new Promise((resolve, reject)=>{
        let keys = Object.keys(ltypes);
        let dashLines = {};
        Promise.each(keys, (key)=>{
            if(typeof ltypes[key] === 'string') return false;
            else return Promise.each(ltypes[key]['patternType'], (total, typeValue)=>{ return total + typeValue},0)
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

    }),
    _getRGBAttr : (rgbObj) => {
        return [
            'rgb(',
            rgbObj.r,',',
            rgbObj.g,',',
            rgbObj.b,');'
        ].join('');
    },
    _genarateMarkUp : (baseAxis) =>{
        // console.log(baseAxis)
        return[
            '<svg ',
            'xmlns="http://www.w3.org/2000/svg" ',
            'xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ',
            'viewBox="',
            baseAxis.viewBox.join(' '),
            '" width="',
            baseAxis.svgWidth,
            '" height="',
            baseAxis.svgHeight,'" fill="black" stroke="black" >'
        ].join('')},
    _polarToCartesian : (cx, cy, radius, angleInDegrees)=>{
        let angleInRadians = (360-angleInDegrees) * Math.PI/180;

        return {
            x: cx + (radius * Math.cos(angleInRadians)),
            y: cy + (radius * Math.sin(angleInRadians))
        };
    },
    _regularArcData : function(x, y, radius, startAngle, endAngle){
        let start = drawSvg._polarToCartesian(x, y, radius, endAngle);
        let end = drawSvg._polarToCartesian(x, y, radius, startAngle);

        let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
        ].join(" ");
    },
    _setEntitiesCommon : (sourceEntity,type, coreData)=> {
        let targetEntity = { type : type};
        if(sourceEntity.hasOwnProperty('handle')) targetEntity.handle = sourceEntity.handle;
        if(sourceEntity.hasOwnProperty('lineType')) targetEntity.lineType = sourceEntity.lineType;
        if(sourceEntity.hasOwnProperty('layer')) targetEntity.layer = sourceEntity.layer;
        if(sourceEntity.hasOwnProperty('lineTypeScale')) targetEntity.lineTypeScale = sourceEntity.lineTypeScale;
        if(sourceEntity.hasOwnProperty('visible')) targetEntity.visible = sourceEntity.visible;
        if(sourceEntity.hasOwnProperty('color')) targetEntity.color = sourceEntity.color;
        if(sourceEntity.hasOwnProperty('colorIndex')) targetEntity.colorIndex = sourceEntity.colorIndex;
        if(sourceEntity.hasOwnProperty('inPaperSpace')) targetEntity.inPaperSpace = sourceEntity.inPaperSpace;
        if(sourceEntity.hasOwnProperty('ownerHandle')) targetEntity.ownerHandle = sourceEntity.ownerHandle;
        if(sourceEntity.hasOwnProperty('materialObjectHandle')) targetEntity.materialObjectHandle = sourceEntity.materialObjectHandle;
        if(sourceEntity.hasOwnProperty('lineWeight')) targetEntity.lineWeight = sourceEntity.lineWeight;
        if(sourceEntity.hasOwnProperty('trueColor')) targetEntity.trueColor = sourceEntity.trueColor;
        if(sourceEntity.hasOwnProperty('extrusionDirection')) targetEntity.extrusionDirection = {
            x : drawSvg._getAxisX(coreData, sourceEntity.extrusionDirection.x),
            y : drawSvg._getAxisX(coreData, sourceEntity.extrusionDirection.y),
            z : sourceEntity.extrusionDirection.z
        };
        return targetEntity;
    },
    _init : (dxfData, io) => new Promise((resolve, reject)=>{
        io.emit('info',JSON.stringify({'type':'baseAxis'}));
        let baseVectors;
        drawSvg._getBaseAxis(dxfData.header)
            .then((baseAxis)=>{
                baseVectors = baseAxis;
                io.emit('info',JSON.stringify({'type':'baseAxis', data:baseAxis}));
                return drawSvg._buildDashArray(dxfData.header['$LTSCALE'], dxfData.tables.ltype)
                    .then((dashLine)=>{
                        io.emit('info',JSON.stringify({type:'lineType', data:dashLine}));
                        return dashLine;
                    });
            }).then(()=>{return { rawData : dxfData , io:io, base : baseVectors}})
            .then((coreData) => {
                return drawSvg._parse(coreData)
                    .then(()=>{
                        return coreData;
                    })
            })
            .then((coreData) => {
                console.log('parse Data Clear');
                resolve('');
            })
    }),
    _parse : (coreData) => new Promise((resolve,reject)=>
        Promise.each(coreData.rawData.entities,(entity)=>{
            return drawSvg._parseEntity(coreData, entity)
                .then((result)=>{
                    if(result) return coreData.io.emit('parse',JSON.stringify(result));
                    else return false;
                })
        })
            .then(()=>{
            resolve(true);
        })),
    _parseBlock : (coreData,entities) => new Promise((resolve,reject)=>{
        let blocks = [];
        Promise.each(entities, (entity)=>{
            return drawSvg._parseEntity(coreData, entity).then((r)=>{
                if(r) return blocks.push(r);
                else return;
            });
        })
            .then(()=>{
                resolve(blocks);
            })
    }),
    _parseEntity : (coreData,entity) => new Promise((resolve, reject) => {
        if(entity.type === 'LINE') drawSvg._line(coreData,entity).then(resolve);
        if(entity.type === 'LWPOLYLINE') drawSvg._polyLine(coreData,entity).then(resolve);
        if(entity.type === 'POLYLINE') drawSvg._polyLine(coreData,entity).then(resolve);
        if(entity.type === 'CIRCLE') drawSvg._circle(coreData,entity).then(resolve);
        if(entity.type === 'ARC') drawSvg._arc(coreData,entity).then(resolve);
        if(entity.type === 'TEXT') drawSvg._text(coreData,entity).then(resolve);
        if(entity.type === 'MTEXT') drawSvg._mtext(coreData,entity).then(resolve);
        if(entity.type === 'INSERT') drawSvg._insert(coreData,entity).then(resolve);
        if(entity.type === 'POINT') drawSvg._point(coreData,entity).then(resolve);
        if(entity.type === 'DIMENSION') drawSvg._dimension(coreData,entity).then(resolve);
        if(entity.type === 'SOLID') drawSvg._solid(coreData,entity).then(resolve);
        if(entity.type === 'ATTDEF') drawSvg._attdef(coreData,entity).then(resolve);
        if(!entity.type.match(/LINE|LWPOLYLINE|POLYLINE|SOLID|CIRCLE|ARC|TEXT|MTEXT|INSERT|POINT|DIMENSION|ATTDEF/)){
            //console.log('Not Match Type!',entity.type);
            resolve(false);
        }
        else resolve(false);
    }),
    _line : (coreData,entity) => new Promise((resolve,reject)=>{
        let line = drawSvg._setEntitiesCommon(entity, 'line', coreData);
        line.x1 = drawSvg._getAxisX(coreData, entity.vertices[0].x);
        line.y1 = drawSvg._getAxisY(coreData, entity.vertices[0].y);
        line.x2 = drawSvg._getAxisX(coreData, entity.vertices[1].x);
        line.y2 = drawSvg._getAxisY(coreData, entity.vertices[1].y);

        if(!line.hasOwnProperty('color')){
            line.color = drawSvg._getColorIdx;
        }

        resolve(line);

    }),
    _polyLine : (coreData,entity) => new Promise((resolve,reject)=>{
        let polyLine = drawSvg._setEntitiesCommon(entity, 'polyline', coreData);
        polyLine.shape = !!entity.shape;
        polyLine.includesCurveFitVertices = !!entity.includesCurveFitVertices;
        polyLine.includesSplineFitVertices = !!entity.includesSplineFitVertices;
        polyLine.is3dPolyline = !!entity.is3dPolyline;
        polyLine.is3dPolygonMesh = !!entity.is3dPolygonMesh;
        polyLine.is3dPolygonMeshClosed = !!entity.is3dPolygonMeshClosed;
        polyLine.isPolyfaceMesh = !!entity.isPolyfaceMesh;
        polyLine.hasContinuousLinetypePattern = !!entity.hasContinuousLinetypePattern;

        let linearArr = [];
        Promise.each(entity.vertices, (vertices)=>{
            return linearArr.push({x : drawSvg._getAxisX(coreData, vertices.x), y:drawSvg._getAxisY(coreData, vertices.y)});
        })
            .then(()=>{
                if(entity.shape) linearArr.push(linearArr[0]);
                polyLine.vertices = linearArr;
                return polyLine
            })
            .then((polyLine)=>{
               resolve(polyLine);
            })
    }),
    _circle : (coreData,entity) => new Promise((resolve,reject)=>{
        let circle = drawSvg._setEntitiesCommon(entity, 'circle', coreData);
        circle.center = {
            x : drawSvg._getAxisX(coreData, entity.center.x),
            y : drawSvg._getAxisX(coreData, entity.center.y),
            z : entity.z
        };
        circle.radius = entity.radius;

        resolve(circle);
    }),
    _arc : (coreData,entity) => new Promise((resolve,reject)=>{
        let arc = drawSvg._setEntitiesCommon(entity, 'arc', coreData);
        arc.center = {
            x : drawSvg._getAxisX(coreData, entity.center.x),
            y : drawSvg._getAxisX(coreData, entity.center.y),
            z : entity.z
        };
        arc.radius = entity.radius;
        arc.endAngle = entity.endAngle;
        arc.startAngle = entity.startAngle;
        arc.angleLength = entity.angleLength;

        resolve(arc);
    }),
    _text : (coreData,entity) => new Promise((resolve,reject)=>{
        let text = drawSvg._setEntitiesCommon(entity, 'text', coreData);
        text.text = entity.text;
        text.startPoint = {
            x : drawSvg._getAxisX(coreData, entity.startPoint.x),
            y : drawSvg._getAxisY(coreData, entity.startPoint.y),
            z : entity.startPoint.z,
        };
        text.endPoint = {
            x : drawSvg._getAxisX(coreData, entity.endPoint.x),
            y : drawSvg._getAxisY(coreData, entity.endPoint.y),
            z : entity.endPoint.z,
        };
        text.textHeight = entity.textHeight;
        text.halign = entity.halign;
        text.valign = entity.valign;
        text.xScale = entity.xScale;
        text.rotation = entity.rotation;
        resolve(text);
    }),
    _mtext : (coreData,entity) => new Promise((resolve,reject)=>{
        let mtext = drawSvg._setEntitiesCommon(entity, 'mtext', coreData);
        mtext.text = entity.text.replace('\\A1;', '');
        mtext.position = {
            x : drawSvg._getAxisX(coreData, entity.position.x),
            y : drawSvg._getAxisY(coreData, entity.position.y),
            z : entity.position.z,
        };

        mtext.textHeight = entity.textHeight;
        mtext.xScale = entity.xScale;
        mtext.rotation = entity.rotation;
        if(typeof entity.attachmentPoint !== 'undefined') mtext.attachmentPoint = entity.attachmentPoint;
        if(typeof entity.drawingDirection !== 'undefined') mtext.drawingDirection = entity.drawingDirection;
        resolve(mtext);
    }),
    _insert : (coreData,entity) => new Promise((resolve,reject)=>{
        if(typeof coreData.rawData.blocks[entity.name].xrefPath === 'undefined' || coreData.rawData.blocks[entity.name].xrefPath == ""){
            let insert = drawSvg._setEntitiesCommon(entity, 'insert', coreData);
            // var insert = {type:'INSERT',_id:''};
            insert.name = entity.name;
            insert.position = {
                x : drawSvg._getAxisX(coreData, entity.position.x),
                y : drawSvg._getAxisY(coreData, entity.position.y),
                z : entity.position.z,
            };

            insert.scale = {
                x : drawSvg._getAxisX(coreData, entity.scale.x),
                y : drawSvg._getAxisY(coreData, entity.scale.y),
                z : entity.scale.z,
            };
            if(typeof entity.columnCount !== 'undefined') insert.columnCount = entity.columnCount;
            if(typeof entity.rowCount !== 'undefined') insert.rowCount = entity.rowCount;
            if(typeof entity.columnSpacing !== 'undefined') insert.columnSpacing = entity.columnSpacing;
            if(typeof entity.rowSpacing !== 'undefined') insert.rowSpacing =entity.rowSpacing;
            if(typeof entity.attributeFlow !== 'undefined') insert.attributeFlow = entity.attributeFlow;

            drawSvg._parseBlock(coreData, coreData.rawData.blocks[entity.name].entities)
                .then((blocks)=>{
                    insert.block = blocks;
                    resolve(insert);
                });
        }else{
            resolve(false);
        }
    }),
    _point : (coreData,entity) => new Promise((resolve,reject)=>{
        let point = drawSvg._setEntitiesCommon(entity, 'point', coreData);
        point.position = {
            x : drawSvg._getAxisX(coreData, entity.position.x),
            y : drawSvg._getAxisY(coreData, entity.position.y),
            z : entity.position.z,
        };
        resolve(point);
    }),
    _dimension : (coreData,entity) => new Promise((resolve,reject)=>{
        let dimension = drawSvg._setEntitiesCommon(entity, 'dimension', coreData);
        dimension.anchorPoint ={
            x : drawSvg._getAxisX(coreData, entity.anchorPoint.x),
            y : drawSvg._getAxisY(coreData, entity.anchorPoint.y),
            z : entity.anchorPoint.z,
        };
        dimension.middleOfText = {
            x : drawSvg._getAxisX(coreData, entity.middleOfText.x),
            y : drawSvg._getAxisY(coreData, entity.middleOfText.y),
            z : entity.middleOfText.z,
        };
        dimension.text = entity.text;
        dimension.actualMeasurement = Number.isNaN(parseFloat(entity.actualMeasurement)) ? 0 : parseFloat(entity.actualMeasurement);
        dimension.attachmentPoint = entity.attachmentPoint;
        dimension.dimensionType = entity.dimensionType;

        drawSvg._parseBlock(coreData, coreData.rawData.blocks[entity.block].entities)
            .then((blocks)=>{
                dimension.blocks = blocks;
                resolve(dimension);
            })
    }),
    _solid : (coreData,entity) => new Promise((resolve,reject)=>{
        let solid = drawSvg._setEntitiesCommon(entity, 'solid', coreData);
        let points = [];
        Promise.each(entity.points, (vertices)=>{
            points.push([{
                x : drawSvg._getAxisX(coreData, vertices.x),
                y : drawSvg._getAxisY(coreData, vertices.y),
                z : vertices.z
            }]);
        }).then(()=>{
            solid.points = points;
            resolve(solid);
        })
    }),
    _attdef : (coreData,entity) => new Promise((resolve,reject)=>{
        let attDef = drawSvg._setEntitiesCommon(entity, 'attdef', coreData);
        attDef.position = {
            x : drawSvg._getAxisX(coreData, entity.position.x),
            y : drawSvg._getAxisY(coreData, entity.position.y),
            z : entity.position.z
        };
        attDef.text = entity.text;
        if(typeof entity.textHeight !== 'undefined') attDef.textHeight = entity.textHeight;
        if(typeof entity.rotation !== 'undefined') attDef.rotation = entity.rotation;
        if(typeof entity.obliqueAngle !== 'undefined') attDef.obliqueAngle = entity.obliqueAngle;
        if(typeof entity.scale !== 'undefined') attDef.scale = entity.scale;
        if(typeof entity.thickness !== 'undefined') attDef.thickness = entity.thickness;
        resolve(attDef);
    })
};

exports.SvgGenerator = drawSvg;