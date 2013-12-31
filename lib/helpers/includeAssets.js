var Handlebars = require('handlebars');

module.exports = function() {
  this._assets = this._assets || [];

  var result = [];

  var alreadyIncluded = {};

  this._assets.forEach(function(value) {
    if (!alreadyIncluded[value]) {
      if (value.match(/\.js$/)) {
        result.push('<script src="' + value + '" type="text/javascript" charset="utf-8"></script>');
      } else {
        result.push('<link rel="stylesheet" href="' + value + '" type="text/css" media="screen" charset="utf-8">');
      }
      alreadyIncluded[value] = true;
    }
  });

  result = result.join("\n");

  return new Handlebars.SafeString(result);
};