module.exports = function(value, decimals, context) {
  if (value !== undefined) {
    var tmp = String(value).split(".");
    if (!tmp[1]) {
      tmp[1] = "00";
    } else if (tmp[1].length == 1) {
      tmp[1] += "0";
    }

    return tmp.join(".");
  } else {
    return undefined;
  }
};