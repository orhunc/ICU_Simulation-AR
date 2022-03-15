console.log("server started");

const path = require('path'); 
var express = require('express');
var app = express();
var serv = require('http').Server(app);

// When the root directory is called, serve 'public' statically, index.html is default
app.use('/', express.static(path.join(__dirname, 'public')));
serv.listen(2000);

//write file logs via POST request
const fs = require('fs');
app.use(express.text());
app.post('/', function (req, res) {
  let date = new Date(Date.now());
  fs.writeFile("logs/LOG_" + date.toISOString(), req.body, function (err) {
  if (err) throw err;
  console.log('Received log!');
  res.end();
  });
});