var when = require('when'),
  parallel = require('when/parallel'),
  fs = require('fs'),
  Handlebars = require('handlebars');

function remove(array, value) {
  var index = array.indexOf(value);

  if (index > -1) {
    array.splice(index, 1);
  }
}


var Renderer = {
  loadedPartials: {},
  loadedHelpers: {},
  _waitingPromises: [],
};


Renderer.loadPartials = function(filter) {
  var glob = require("glob");
  var d = when.defer();

  this._waitingPromises.push(d.promise);

  if (typeof filter === 'string') {

    glob(filter, (function(err, helpers) {
      var partialList = [];
      helpers.forEach((function(helper) {
        var match = helper.match(/\/([^\/]*)\.mustache$/);
        partialList.push(this.loadPartial(helper, match[1]));
      }).bind(this));

      when.all(partialList).then(function() {
        d.resolve();
      });


    }).bind(this));

  }

  when(d.promise).then((function() {
    remove(this._waitingPromises, d.promise);
  }).bind(this));

};


Renderer.loadPartial = function(path, name) {
  //TODO check if partial is already loaded
  var d = when.defer();
  fs.readFile(path, function(err, data) {
    if (err) throw err;
    Handlebars.registerPartial(name, String(data));
    d.resolve();
  });

  return d.promise;
};


Renderer.loadHelpers = function(filter) {
  var glob = require("glob");
  var d = when.defer();

  this._waitingPromises.push(d.promise);

  if (typeof filter === 'string') {

    glob(filter, (function(err, helpers) {
      var helpersList = [];
      helpers.forEach((function(helper) {
        var match = helper.match(/\/([^\/]*)\.js$/);
        this.loadHelper(helper, match[1]);
      }).bind(this));

      d.resolve();

    }).bind(this));

  }

  when(d.promise).then((function() {
    remove(this._waitingPromises, d.promise);
  }).bind(this));
};

Renderer.loadHelper = function(path, name) {

  if (this.loadedHelpers[name]) {
    if (this.loadedHelpers[name] !== path) {
      console.warn(name + " overweitten by: " + path);
    };
  } else {
    this.loadedHelpers[name] = path;
    Handlebars.registerHelper(name, require(path));
    //console.log(name + ' ' + path);
  }
}

//TODO cache templates (with sopport to clear templates)

function getTemplates(tpls) {
  var d = when.defer();

  var keys = [];
  var loadList = [];

  for (var name in tpls) {
    if (tpls.hasOwnProperty(name)) {
      keys.push(name);
      loadList.push(getTemplate(tpls[name]));
    }
  }

  when.all(loadList)
    .then(function(result) {
      var list = {};
      result.forEach(function(value, idx) {
        list[keys[idx]] = value;
      });
      d.resolve(list);
    });

  return d.promise;
}


function getTemplate(path) {
  var d = when.defer();

  fs.readFile(path,

    function(err, data) {
      if (err) throw err;
      var template = Handlebars.compile(String(data));
      d.resolve(template);
    });

  return d.promise;
}


Renderer.setup = function(options) {
  console.warn('Deprecated: handlebars-renderer.setup() not required anymore');
};

//load default helpers
Renderer.loadHelpers(__dirname + "/lib/helpers/*.js");

Renderer.__express = function(path, opt, cb) {
  var pTemplates = getTemplates({
    layout: opt.settings.layouts + "/" + (opt.settings.layout || 'main') + ".mustache",
    content: path
  });

  var promises = Renderer._waitingPromises.slice(0);
  promises.unshift(pTemplates);

  when.all(promises).then(function(tpls) {
    tpls = tpls[0];
    try {
      opt.bodyContent = new Handlebars.SafeString(tpls.content(opt));

      var complete = tpls.layout(opt);
      cb(null, complete);
    } catch (e) {
      cb(e);
    }
  });
};

module.exports = Renderer;
