//==========================================================
//                          API
//==========================================================

var clc = require("cli-color");
var info = clc.blue;
var msg = clc.xterm(129);

var express = require("express");
var path = require("path");
var session = require("express-session");
var bodyParser = require("body-parser");
var app = express();

app.use(express.static(__dirname + "/views"));
app.engine("html", require("ejs").renderFile);

app.use(session({
                    secret: "s3cr37",
                    resave: true, saveUninitialized: true
                }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


 // Add headers
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

var api = require("./routes/api.js");
app.use("/api", api);

var port = process.env.PORT || 1300;
app.listen(port, function () {
    console.log(msg("\nSistema ASTRO - Web API started"));
    console.log(msg("    Web API listening at PORT -> " + port));
});
