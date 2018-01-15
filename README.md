# dxftojson
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