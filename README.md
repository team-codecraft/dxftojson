# dxftojson

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]

convert dxf file into json format

## Getting started

install package 

```
const dxftojson = require('dxftojson');

dxftojson('./sample/file2.dxf' , 'out.json')
.then(result=>{
    return result;  
})

```


[npm-image]: https://img.shields.io/npm/v/dxftojson.svg?style=flat
[npm-url]: https://npmjs.org/package/dxftojson
[downloads-image]: https://img.shields.io/npm/dm/dxftojson.svg?style=flat
[downloads-url]: https://npmjs.org/package/dxftojson
[travis-image]: https://travis-ci.org/team-codecraft/dxftojson.svg?branch=master
[travis-url]: https://travis-ci.org/team-codecraft/dxftojson
