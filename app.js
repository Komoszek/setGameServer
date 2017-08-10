var express = require("express");
var app = express();
var path    = require("path");


app.use(express.static(__dirname + '/public'));
//Store all HTML files in view folder.

app.get('/',function(req,res){
  res.sendFile('/index.html');
  //It will find and locate index.html from View or Scripts
});


app.listen(3000, function(){
  console.log('listening on *:3000');
});
