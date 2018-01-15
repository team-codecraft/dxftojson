const HeaderParser = require('./parser/header-parser').HeaderParser;
const TablesParser = require('./parser/tables-parser').TablesParser;
const BlocksParser = require('./parser/blocks-parser').BlocksParser;
const EntitiesParser = require('./parser/entities-parser').EntitiesParser;


const fs = require('fs');
const readline = require('readline');
const EventEmitter = require('events').EventEmitter;

class DxfParser extends EventEmitter{
    constructor(){
        super();
        this.readLine = readline;
        this.parser = {};
    }
    init(path){
        let data = {
            header : [],
            tables : {
                vport : [],
                ltype : [],
                layer : [],
                appid : [],
                block_record : [],
                dimstyle : [],
                style : [],
                ucs : [],
                view : []
            },
            blocks : [],
            entities : [],
            objects : []
        };
        let reader = this.readLine.createInterface({
            input: fs.createReadStream(path, 'utf-8'),
            crlfDelay: Infinity
        });
        let idx = 0;
        let cursorCode;
        let cursorValue;
        let sectionActive = false;
        let activeBuffer = '';

        let activeTable = false;
        let tablePhase = '';

        let activeBlock = false;
        let activeBlockIdx = 0;
        let activeBlockEntity = false;
        let blockEntityHasSeqEnd = false;
        let activeBlockEntityIdx = -1;
        let activeBlockEntityPhase = '';

        let entitiesIdx = -1;
        let hasSeqEnd = false;
		let _self = this;
		
		return new Promise(function(resolve,reject){
			reader.on('line',(line)=>{

	            if(idx%2 === 0) cursorCode = parseInt(line);
	            else cursorValue = _self._parseGroupValue(cursorCode, line.trim());
	
	            if(idx%2 === 1 && cursorCode === 0 && cursorValue === 'ENDSEC'){
	                sectionActive = false;
	                activeBuffer = '';
	            }
	
	            if(idx%2 === 1 && sectionActive && activeBuffer.match(/^HEADER$|^TABLES$|^BLOCKS$|^ENTITIES$|^OBJECTS$/)){
	                if(activeBuffer === 'TABLES'){
	                    if(cursorCode === 0 && cursorValue === 'ENDTAB'){
	                        activeTable = false;
	                        tablePhase = '';
	                    }
	
	                    if(activeTable && tablePhase !== ''){
	                        data.tables[tablePhase.toLowerCase()].push({code : cursorCode, value : cursorValue});
	                    }
	
	                    if(cursorCode === 0 && cursorValue === 'TABLE') {
	                        activeTable = true;
	                    }
	
	                    if(activeTable && cursorCode === 2 && cursorValue.match(/^VPORT$|^LTYPE$|^LAYER$|^APPID$|^BLOCK_RECORD$|^DIMSTYLE$|^STYLE$|^UCS$|^VIEW$/)){
	                        tablePhase = cursorValue;
	                    }
	                } else if (activeBuffer === 'BLOCKS'){
	
	                    if(cursorCode === 0 && cursorValue === 'ENDBLK'){
	                        activeBlock = false;
	                        activeBlockIdx++;
	                        activeBlockEntity = false;
	                        activeBlockEntityIdx = -1;
	                        activeBlockEntityPhase = '';
	                    }
	
	                    if(activeBlock){
	                        if(cursorCode === 0 ){
	                            if(!blockEntityHasSeqEnd){
	                                activeBlockEntity = true;
	                                activeBlockEntityIdx++;
	                                data.blocks[activeBlockIdx].entities.push({ type : cursorValue , hasSeq : false, data : [{code : cursorCode, value : cursorValue}]});
	                            } else {
	                                data.blocks[activeBlockIdx].entities[activeBlockEntityIdx].data.push({code : cursorCode, value : cursorValue});
	                            }
	                            if(cursorValue === 'SEQEND') blockEntityHasSeqEnd = false;
	                        } else {
	                            if(activeBlockEntityIdx < 0){
	                                data.blocks[activeBlockIdx].block.push({code : cursorCode, value : cursorValue});
	                            } else {
	                                if(cursorCode === 66) {
	                                    blockEntityHasSeqEnd = true;
	                                    data.blocks[activeBlockIdx].entities[activeBlockEntityIdx].hasSeq = true;
	                                }
	                                if(activeBlockEntity){
	                                    data.blocks[activeBlockIdx].entities[activeBlockEntityIdx].data.push({code : cursorCode, value : cursorValue});
	                                }
	                            }
	                        }
	
	                    }
	
	                    if(cursorCode === 0 && cursorValue === 'BLOCK'){
	                        activeBlock = true;
	                        data.blocks[activeBlockIdx] = { block : [], entities : []};
	                    }
	                } else if (activeBuffer === 'ENTITIES'){
	                    if(cursorCode === 0){
	                        if(!hasSeqEnd){
	                            entitiesIdx++;
	                            data.entities.push({type: cursorValue, hasSeq : false, data :[{code : cursorCode, value : cursorValue}]});
	                        } else {
	                            data.entities[entitiesIdx].data.push({code : cursorCode, value : cursorValue});
	                        }
	                        if(cursorValue === 'SEQEND') hasSeqEnd = false;
	                    }else{
	                        if(cursorCode === 66){
	                            hasSeqEnd = true;
	                            data.entities[entitiesIdx].hasSeq = true;
	                        }
	                        data.entities[entitiesIdx].data.push({code : cursorCode, value : cursorValue});
	                    }
	                } else {
	                    data[activeBuffer.toLowerCase()].push({code : cursorCode, value : cursorValue});
	                }
	            }
	
	            if(typeof cursorCode !== 'undefined' && cursorCode === 0 && cursorValue === 'SECTION'){
	                sectionActive = true;
	            }
	            if(sectionActive && cursorCode === 2 && typeof cursorValue === 'string' && cursorValue.match(/^HEADER$|^TABLES$|^BLOCKS$|^ENTITIES$|^OBJECTS$/)){
	                _self.emit( 'transfer' ,{ section : cursorValue });
	                activeBuffer = cursorValue;
	            }
	            idx++;
	        });
	
	        reader.on('close', ()=>{
	            _self.emit( 'ready' );
	            _self.lastHandle = 0;
	            // this.interpreter = new DxfInterpreter(data);
	            // fs.writeFileSync('blocksEntities.json', JSON.stringify(data.entities, null, 3));
	            _self.parser['HEADER'] = new HeaderParser(data.header);
	            // this.parser['CLASSES'] = new ClassesParser();
	            _self.parser['TABLES'] = new TablesParser(data.tables);
	            _self.parser['BLOCKS'] = new BlocksParser(data.blocks);
	            _self.parser['ENTITIES']= new EntitiesParser(data.entities);
	            // this.parser['OBJECTS'] = new ObjectsParser();
				
				_self._transferData()
				.then(result=>{
					resolve(result);	
				});
	        });
		});
    }

    _transferData(){
        return Promise.all([
	        this.parser['HEADER'].parse(),
	        this.parser['TABLES'].parse(),
	        this.parser['BLOCKS'].parse(),
	        this.parser['ENTITIES'].parse()
        ])
        .then(result=>{
	        return {
		       HEADER:result[0],
		       TABLES:result[1],
		       BLOCKS:result[2],
		       ENTITIES:result[3]
	        }
        })
    }

    _parseBoolean(str){
        if(str === '0') return false;
        if(str === '1') return true;
        throw TypeError('String \'' + str + '\' cannot be cast to Boolean type');
    }

    _parseGroupValue(code, value){
        // 0-9 문자열
        if(code <= 9) return value;

        // 10-39 배정밀도 3D 점 값
        // 40-59 배정밀도 부동 소수 값
        if(code >= 10 && code <= 59) return  Math.round(value*10000000)/10000000;

        // 60-79 16비트 정수
        // 90-99 32비트 정수
        if(code >= 60 && code <= 99) return parseInt(value);

        //100 문자열
        //102 문자열
        //105 16진 핸들값을 나타내는 문자열
        if(code >= 100 && code <= 109) return value;

        //110-119 배정밀도 부동 소수값
        //120-129 상동
        //130-139 상동
        //140-149 배정밀도 스칼라 부동소수 값
        if(code >= 110 && code <= 149) return  Math.round(value*10000000)/10000000;

        //160-169 64비트 정수값
        //170-179 16비트 정수값
        if(code >= 160 && code <= 179) return parseInt(value);

        //210-239 배정밀도 부동소수 값
        if(code >= 210 && code <= 239) return  Math.round(value*10000000)/10000000;

        //270-279 16비트 정수값
        //280-289 상동
        if(code >= 270 && code <= 289) return parseInt(value);

        //290-299 부울 플래그 값
        if(code >= 290 && code <= 299) return this._parseBoolean(value);

        //300-309 임의 문자열
        //310-319 이진 청크의 16진 값의 문자열
        //320-329 16진 행들 값을 나타내는 문자열
        //330-369 16진 객체 ID를 나타내는 문자열
        if(code >= 300 && code <= 369) return value;

        //370-379 16비트 정수 값
        //380-389 16비트 정수 값
        if(code >= 370 && code <= 389) return parseInt(value);

        //390-399 16진 핸들 값을 나타내는 문자열
        if(code >= 390 && code <= 399) return value;

        //400-409 16비트 정수 값
        if(code >= 400 && code <= 409) return parseInt(value);

        //410-419 문자열
        if(code >= 410 && code <= 419) return value;

        //420-429 32비트 정수 값.
        if(code >= 420 && code <= 429) return parseInt(value);

        //430-439 문자열
        if(code >= 430 && code <= 439) return value;

        //440-449 32비트 정수 값.
        //450-459 배정밀도
        if(code >= 440 && code <= 459) return parseInt(value);

        //460-469 배정밀도 부동 소수 값
        if(code >= 460 && code <= 469) return  Math.round(value*10000000)/10000000;

        //470-479 문자열
        //480-481 16진 핸들 값을 나타내는 문자열
        if(code >= 470 && code <= 481) return value;

        //999 주석(문자열)
        if(code === 999) return value;
        //1000-1009 문자열(0-9 코드 범위에서와 동일한 한계)
        if(code >= 1000 && code <= 1009) return value;

        //1010-1059 배정밀도 부동 소수 값
        if(code >= 1010 && code <= 1059) return  Math.round(value*10000000)/10000000;

        //1060-1070 16비트 정수 값
        //1071 32비트 정수 값
        if(code >= 1060 && code <= 1071) return parseInt(value);

        console.log('WARNING: Group code does not have a defined type: %j', { code: code, value: value });
        return value;
    }

}

exports.DxfParser = DxfParser;