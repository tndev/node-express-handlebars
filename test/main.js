var handlebars = require('../handlebars-renderer');

var options = {
  settings : {
    layouts : __dirname+'/tpls/layouts',
    layout  : 'main'
  } 
}

handlebars.loadPartials('test.prefix.',__dirname+'/tpls/partial/*.mustache');
handlebars.__express(__dirname+'/tpls2/views/content.mustache',options, function() {
  console.dir(arguments);
});