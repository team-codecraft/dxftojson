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
}