var processor = require('../dist/minify');
var fs = require('fs');
var path = require('path');

var html = fs.readFileSync(path.join(__dirname,'public','index.html'));

console.log(processor(html,{root: path.join(__dirname,'public')}));
