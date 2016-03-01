var format = require('date-format');

var _ = require("underscore");
var clc = require("cli-color");
var info = clc.cyan;
var rqs = clc.xterm(129);

var log = function(req){ 
    var date = format('dd/MM/yy hh:mm:ss', new Date());
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(rqs(date + " | Request ("+ip+"): " + req.method + " -> " + req.baseUrl + req.url));
    if(!_.isEmpty(req.params)){
        console.log(rqs("  |> ") + info.bold("params: ") + JSON.stringify(req.params));
    }
    if(!_.isEmpty(req.body)){
        console.log(rqs("  |> ") +info.bold("body: ") + JSON.stringify(req.body));
    }
}

module.exports = log;
