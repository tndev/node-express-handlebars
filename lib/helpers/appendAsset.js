module.exports = function(url) {
  this._assets = this._assets || [];
  this._assets.push(url);
  return "";
};
