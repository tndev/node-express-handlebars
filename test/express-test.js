var express = require('express');
var handlebars = require('../handlebars-renderer');


var app = express();


app.engine('mustache', handlebars.__express);
app.set('views', __dirname + '/tpls/views');
app.set('layouts', __dirname + '/tpls/layouts');
app.set('view engine', 'mustache');

app.get('/',function(req, res) {
  //testing absolute path
  res.render(__dirname+'/tpls2/views/content');
})

var server = app.listen(1337, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

});