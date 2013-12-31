var Handlebars = require('handlebars');

module.exports = function(action) {
  var cp = arguments[arguments.length - 1];
  var ret = '<form method="post" action="' + Handlebars.Utils.escapeExpression(action) + '">';

  ret += cp.fn(this);
  if (this._csrf) {
    ret += '<input type="hidden" value="' + Handlebars.Utils.escapeExpression(this._csrf) + '" name="_csrf">';
  }
  ret += '</form>';

  return ret;
};
