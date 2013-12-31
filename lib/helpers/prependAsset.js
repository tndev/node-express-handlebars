module.exports = function(url) {
  this._assets = this._assets || [];
  this._assets.unshift(url);
  return "";
};
