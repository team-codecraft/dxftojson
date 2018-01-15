# dxftojson [![Build Status](https://travis-ci.org/team-codecraft/dxftojson.svg?branch=master)](https://travis-ci.org/team-codecraft/dxftojson) 

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