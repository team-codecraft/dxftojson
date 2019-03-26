const dxftojson = require('../');
const assert = require('chai').assert;

describe('Test suit', function () {
  it('should be ok', function (done) {
    dxftojson('./sample/sample7.dxf', 'out.json')
    .then(result => {
	    assert.containsAllKeys(result, ['HEADER', 'TABLES', 'BLOCKS', 'ENTITIES']);
			done();
    })
  });
});
