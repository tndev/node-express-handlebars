var handlebars = require('../handlebars-renderer');

var options = {
  settings : {
    layouts : __dirname+'/tpls/layouts',
    layout  : 'main'
  } 
}

handlebars.setup();
handlebars.loadPartials(__dirname+'/tpls/partial/*.mustache');
handlebars.__express(__dirname+'/tpls/views/content.mustache',options, function() {
  console.dir(arguments);
});