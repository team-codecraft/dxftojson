const Promise = require('bluebird');
const fs = require('fs');

let term = {
    x1 :808396.1910698891,
    x2 :814902.7010945941,
    y1 :82103.73062537977,
    y2 :80559.39041963499
};

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
    _drawSvg : (writeStream,sourceText)=>{
        writeStream.write(sourceText + '\n');
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
            // return drawSvg._getRGBAttr(entity.color.rgb);
            return drawSvg._getRGBAttr(entity.color.hexCode);
        } else if(entity.hasOwnProperty('layer') && coreData.rawData.tables.layer.hasOwnProperty(entity.layer)){
            // return drawSvg._getRGBAttr(coreData.rawData.tables.layer[entity.layer].color.rgb);
            return drawSvg._getRGBAttr(coreData.rawData.tables.layer[entity.layer].color.hexCode);
        } else {
            console.log('@@@@@@@@', entity)
            // return drawSvg._getRGBAttr({r : 255, g : 255, b : 255});
            return '#000';
        }
        // return drawSvg._getRGBAttr({r : 0, g : 0, b : 0});
    },
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
        var angleInRadians = (360-angleInDegrees) * Math.PI/180;

        return {
            x: cx + (radius * Math.cos(angleInRadians)),
            y: cy + (radius * Math.sin(angleInRadians))
        };
    },
    _regularArcData : function(x, y, radius, startAngle, endAngle){
        var start = drawSvg._polarToCartesian(x, y, radius, endAngle);
        var end = drawSvg._polarToCartesian(x, y, radius, startAngle);

        var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
        ].join(" ");
    },
    _setEntitiesCommon : (sourceEntity,type)=> {
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

        return targetEntity;
    },
    _init : (dxfData, exportPath) => new Promise((resolve, reject)=>{
        let writeStream = fs.createWriteStream(exportPath, {flags: 'a'});
        let baseVectors;
        drawSvg._drawSvg(writeStream, '<!DOCTYPE html>');
        drawSvg._drawSvg(writeStream, '<html><head></head><body><div id="wrapper">');
        drawSvg._getBaseAxis(dxfData.header)
            .then((baseAxis)=>{
                baseVectors = baseAxis;
                return drawSvg._drawSvg(writeStream, drawSvg._genarateMarkUp(baseAxis))
            }).then(()=>{return { rawData : dxfData , ws : writeStream, base : baseVectors}})
            .then((coreData) => {
                return drawSvg._parse(coreData)
                    .then(()=>{
                        return coreData;
                    })
            })
            .then((coreData) => {
                console.log('parse Data Clear');
                drawSvg._drawSvg(coreData.ws, '</svg></div></body>');
                resolve('');
            })
    }),
    _parse : (coreData) => new Promise((resolve,reject)=>
        Promise.each(coreData.rawData.entities,(entity)=>{
            return drawSvg._parseEntity(coreData, entity)
                .then((result)=>{
                    if(result) return drawSvg._drawSvg(coreData.ws, result);
                    else return false;
                })
        }).then(()=>{
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
    }),
    _line : (coreData,entity) => new Promise((resolve,reject)=>{
        let line = {};
        line.st_vector = entity.vertices[0];
        line.nd_vector = entity.vertices[1];
        line.layer = entity.layer;
        if(typeof entity.colorIndex !== 'undefined') line.colorIdx = entity.colorIndex;
        if(typeof entity.color !== 'undefined') line.color = entity.color;
        if(typeof entity.lineType !== 'undefined') line.lineType = entity.lineType;
        if(typeof entity.lineWeight !== 'undefined') line.lineWeight = entity.lineWeight;
        if(typeof entity.lineTypeScale !== 'undefined') line.lineTypeScale = entity.lineTypeScale;

        line.x1 = drawSvg._getAxisX(coreData, line.st_vector.x);
        line.y1 = drawSvg._getAxisY(coreData, line.st_vector.y);
        line.x2 = drawSvg._getAxisX(coreData, line.nd_vector.x);
        line.y2 = drawSvg._getAxisY(coreData, line.nd_vector.y);

        resolve('<line data-col-group="line" x1="'+drawSvg._getAxisX(coreData, line.st_vector.x)+'" y1="'+drawSvg._getAxisY(coreData, line.st_vector.y)+'" x2="'+drawSvg._getAxisX(coreData, line.nd_vector.x)+'" y2="'+drawSvg._getAxisY(coreData, line.nd_vector.y)+'"  style="fill:none;stroke:'+ drawSvg._getColorIdx(coreData, line) +';stroke-width:1;" />');
    }),
    _polyLine : (coreData,entity) => new Promise((resolve,reject)=>{
        let polyLine = {};
        polyLine.shape = !!entity.shape;
        polyLine.type = entity.type;
        polyLine.layer = entity.layer;
        if(typeof entity.colorIndex !== 'undefined') polyLine.colorIdx = entity.colorIndex;
        if(typeof entity.color !== 'undefined') polyLine.color = entity.color;
        if(typeof entity.lineType !== 'undefined') polyLine.lineType = entity.lineType;
        if(typeof entity.width !== 'undefined') polyLine.width = entity.width;
        if(typeof entity.elevation !== 'undefined') polyLine.elevation = entity.elevation;
        if(typeof entity.lineTypeScale !== 'undefined') polyLine.lineTypeScale = entity.lineTypeScale;
        let linearArr = entity.vertices;
        let linearPath = [];
        Promise.each(entity.vertices, (vertices)=>{
            linearPath.push([drawSvg._getAxisX(coreData, vertices.x),drawSvg._getAxisY(coreData, vertices.y)].join(','));
            return;
        })
            .then(()=>{
                if(entity.shape){
                    linearArr.push(linearArr[0]);
                    linearPath.push([drawSvg._getAxisX(coreData, linearArr[0].x),drawSvg._getAxisY(coreData, linearArr[0].y)].join(','));
                    return;
                }else{
                    return;
                }
            })
            .then(()=>{
                resolve('<polyline data-col-group="'+polyLine.type+'" points="'+linearPath.join(' ')+'" style="fill:none;stroke:'+ drawSvg._getColorIdx(coreData, polyLine) +';stroke-width:1;" />');
            })
    }),
    _circle : (coreData,entity) => new Promise((resolve,reject)=>{
        let circle = {};
        circle.radius = entity.radius;
        circle.center = entity.center;
        circle.layer = entity.layer;
        if(typeof entity.lineWeight !== 'undefined')circle.lineWeight = entity.lineWeight;

        resolve('<circle data-col-group="circle" cx="'+drawSvg._getAxisX(coreData, circle.center.x)+'" cy="'+drawSvg._getAxisY(coreData, circle.center.y)+'" r="'+(circle.radius)+'" stroke="'+drawSvg._getColorIdx(coreData, entity)+'" stroke-width="1" fill="none" style=""/>')
    }),
    _arc : (coreData,entity) => new Promise((resolve,reject)=>{
        let arc = {};
        arc.center = entity.center;
        arc.layer = entity.layer;
        if(typeof entity.radius !== 'undefined') arc.radius = entity.radius;
        if(typeof entity.colorIndex !== 'undefined') arc.colorIdx = entity.colorIndex;
        if(typeof entity.color !== 'undefined') arc.color = entity.color;
        if(typeof entity.lineWeight !== 'undefined') arc.lineWeight = entity.lineWeight;
        if(typeof entity.startAngle !== 'undefined') arc.startAngle = entity.startAngle;
        if(typeof entity.endAngle !== 'undefined') arc.endAngle = entity.endAngle;
        if(typeof entity.angleLength !== 'undefined') arc.angleLength = entity.angleLength;

        resolve('<path d="'+ drawSvg._regularArcData(drawSvg._getAxisX(coreData, arc.center.x), drawSvg._getAxisY(coreData, arc.center.y),arc.radius, arc.startAngle, arc.endAngle) +'" stroke="'+drawSvg._getColorIdx(coreData, arc)+'" stroke-width="1"  fill="transparent" />');
    }),
    _text : (coreData,entity) => new Promise((resolve,reject)=>{
        let text = {};
        text.text = entity.text;
        text.startPoint = entity.startPoint;
        text.endPoint = entity.endPoint;
        text.layer = entity.layer;
        if(typeof entity.textHeight !== 'undefined') text.textHeight = entity.textHeight;
        if(typeof entity.halign !== 'undefined') text.halign = entity.halign;
        if(typeof entity.valign !== 'undefined') text.valign = entity.valign;
        if(typeof entity.colorIndex !== 'undefined') text.colorIdx = entity.colorIndex;
        if(typeof entity.color !== 'undefined') text.color = entity.color;

        resolve('<text data-col-group="text" x="'+drawSvg._getAxisX(coreData, text.startPoint.x)+'" y="'+drawSvg._getAxisY(coreData, text.startPoint.y)+'" stroke="'+drawSvg._getColorIdx(coreData, text)+'" style="" stroke-width="1" font-size="'+Math.ceil(text.textHeight)+'" >'+drawSvg._encode(text.text)+'</text>');
    }),
    _mtext : (coreData,entity) => new Promise((resolve,reject)=>{
        let mtext = {};
        mtext.text = entity.text.replace('\\A1;', '');
        mtext.position = entity.position;
        mtext.layer = entity.layer;
        if(typeof entity.height !== 'undefined') mtext.height = entity.height;
        if(typeof entity.width !== 'undefined') mtext.width = entity.width;
        if(typeof entity.colorIndex !== 'undefined') mtext.colorIdx = entity.colorIndex;
        if(typeof entity.color !== 'undefined') mtext.color = entity.color;
        if(typeof entity.attachmentPoint !== 'undefined') mtext.attachmentPoint = entity.attachmentPoint;
        if(typeof entity.drawingDirection !== 'undefined') mtext.drawingDirection = entity.drawingDirection;
        resolve('<text data-col-group="mtext" x="'+drawSvg._getAxisX(coreData, mtext.position.x)+'" y="'+drawSvg._getAxisY(coreData, mtext.position.y)+'" stroke="'+drawSvg._getColorIdx(coreData, mtext)+'" stroke-width="1" font-size="'+Math.ceil(mtext.height)+'" >'+drawSvg._encode(mtext.text)+'</text>');
    }),
    _insert : (coreData,entity) => new Promise((resolve,reject)=>{
        if(typeof coreData.rawData.blocks[entity.name].xrefPath === 'undefined' || coreData.rawData.blocks[entity.name].xrefPath == ""){
            let insert = {};
            // var insert = {type:'INSERT',_id:''};
            insert.position = entity.position;
            insert.layer = entity.layer;
            if(typeof entity.xScale !== 'undefined') insert.xScale = entity.xScale;
            if(typeof entity.yScale !== 'undefined') insert.yScale = entity.yScale;
            if(typeof entity.zScale !== 'undefined') insert.zScale = entity.zScale;
            if(typeof entity.colorIndex !== 'undefined') insert.colorIdx = entity.colorIndex;
            if(typeof entity.color !== 'undefined') insert.color = entity.color;
            if(typeof entity.lineWeight !== 'undefined') insert.lineWeight = entity.lineWeight;
            if(typeof entity.rotation !== 'undefined') insert.rotation = parseInt(entity.rotation);
            drawSvg._parseBlock(coreData, coreData.rawData.blocks[entity.name].entities)
                .then((blocks)=>{
                    insert.block = blocks;
                    resolve('<g data-col-group="insert" transform="translate('+drawSvg._getAxisX(coreData, insert.position.x)+','+drawSvg._getAxisY(coreData, insert.position.y)+') rotate('+(insert.rotation  ? insert.rotation*-1 : 0)+') scale('+(insert.xScale ?  insert.xScale : 1)+')" >\n'+ insert.block +'</g>');
                });
        }else{
            resolve(false);
        }
    }),
    _point : (coreData,entity) => new Promise((resolve,reject)=>{
        let point = {};
        point.position = entity.position;
        point.layer = entity.layer;
        resolve('<circle data-col-group="point"  cx="'+drawSvg._getAxisX(coreData, point.position.x)+'" cy="'+drawSvg._getAxisY(coreData, point.position.y)+'" r="10" stroke="black" stroke-width="1" fill="red" style=""/>');
    }),
    _dimension : (coreData,entity) => new Promise((resolve,reject)=>{
        let dimension = {};
        dimension.anchorPoint = entity.anchorPoint;
        dimension.middleOfText = entity.middleOfText;
        dimension.layer = entity.layer;
        if(typeof entity.attachmentPoint !== 'undefined') dimension.attachmentPoint = entity.attachmentPoint;
        if(typeof entity.actualMeasurement !== 'undefined') dimension.actualMeasurement = Number.isNaN(parseInt(entity.actualMeasurement)) ? 0 : parseInt(entity.actualMeasurement);
        if(typeof entity.angle !== 'undefined') dimension.angle = entity.angle;
        if(typeof entity.text !== 'undefined') dimension.text = entity.text;

        drawSvg._parseBlock(coreData, coreData.rawData.blocks[entity.block].entities)
            .then((blocks)=>{
                resolve(blocks.join(''));
            })
    }),
    _solid : (coreData,entity) => new Promise((resolve,reject)=>{
        let solid = {};
        solid.layer = entity.layer;
        if(typeof entity.colorIndex !== 'undefined') solid.colorIdx = entity.colorIndex;
        if(typeof entity.color !== 'undefined') solid.color = entity.color;
        if(typeof entity.lineType !== 'undefined') solid.lineType = entity.lineType;
        if(typeof entity.lineTypeScale !== 'undefined') solid.lineTypeScale = entity.lineTypeScale;

        let linearArr = entity.points;
        let linearPath = [];
        Promise.each(entity.points, (vertices)=>{
            linearPath.push([drawSvg._getAxisX(coreData, linearArr[0].x),drawSvg._getAxisY(coreData, linearArr[0].y)].join(','));
        }).then(()=>{
            resolve('<polyline data-col-group="solid" points="'+linearPath.join(' ')+'" style="fill:none;stroke:'+drawSvg._getColorIdx(coreData, solid)+';stroke-width:1;" />');
        })
    }),
    _attdef : (coreData,entity) => new Promise((resolve,reject)=>{
        let attDef = {};
        attDef.position = entity.position;
        attDef.text = entity.text;
        attDef.layer = entity.layer;
        if(typeof entity.textHeight !== 'undefined') attDef.textHeight = entity.textHeight;
        if(typeof entity.colorIndex !== 'undefined') attDef.colorIdx = entity.colorIndex;
        if(typeof entity.color !== 'undefined') attDef.color = entity.color;

        resolve('<text data-col-group="attdef" x="'+drawSvg._getAxisX(coreData, attDef.position.x)+'" y="'+drawSvg._getAxisY(coreData, attDef.position.y)+'" stroke="'+drawSvg._getColorIdx(coreData, attDef)+'" fill="'+drawSvg._getColorIdx(coreData, attDef)+'" stroke-width="1" font-size="'+Math.ceil(attDef.textHeight)+'" >'+drawSvg._encode(attDef.text)+'</text>');
    })
};

exports.SvgGenerator = drawSvg;