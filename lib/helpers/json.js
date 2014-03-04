var Handlebars = require('handlebars');

module.exports = function(data) {
  
  return new Handlebars.SafeString(JSON.stringify(data));
};