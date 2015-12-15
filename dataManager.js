"use strict";
//==========================================================
//               MYSQL
//==========================================================

var mysql = require('mysql');
var pool  = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'homeUser',
    password: '',
    database: "home-automation"
});

