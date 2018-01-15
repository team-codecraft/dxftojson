
const DxfParser = require('./lib/dxf-parser.js').DxfParser;
const fs = require('fs');
const path = require('path');
const parser = new DxfParser();

module.exports = function (dxfpath, outputpath) {
	
	
	return parser.init(dxfpath)
	.then((result)=>{
		fs.writeFileSync(outputpath, JSON.stringify(result, null, 3));
		return result;
	});
	
	/*
	return new Promise(function(resolve , reject){
		
		parser.init(dxfpath);

		parser.on('ready',()=>{
		    //console.log('ready');
		});
		parser.on('flush',(result)=>{
		    //console.log('flush', result.section );
		});
		parser.on('complete',(result)=>{
		    fs.writeFileSync(output, JSON.stringify(result, null, 3));
		    resolve('complete Transfer Json with DXF');
		    // return SvgGenerator._init(result, 'test.html');
		});
	});
	*/
}