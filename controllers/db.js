require('dotenv').config();
const config = require('../config/config');
var mysql      = require('mysql');

var connection = mysql.createConnection({
  host     : config.get('db.host'),
  user     : config.get('db.user'),
  password : config.get('db.password'),
  database : config.get('db.name')
});

connection.connect();

module.exports=connection;
