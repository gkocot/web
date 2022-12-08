let static = require('node-static');
let http = require('http');

var file = new(static.Server)(__dirname, {cache: false});

http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(8080);