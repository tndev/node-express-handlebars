var Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  Handlebars = require('handlebars'),
  S = require('string'),
  globAsync = Promise.promisify(require('glob'));



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

function validateGlobFilter(filter) {
  return new Promise(function(resolve, reject) {
    if (typeof filter !== 'string') {
      reject(new Error('Fitler has to be a string, but is of type "'+(typeof filter)+'"'));
    } else {
      resolve(filter);
    }
  });
}

/**
 * The waiting list takes care about all promiese that need to be resolved
 * before rendering can start.
 */
Renderer._registerWaitingPromise = function(promise) {
  this._waitingPromises.push(promise);
  
  promise.then(function() {
    remove(this._waitingPromises, promise);
  })
  .catch(function() {
    remove(this._waitingPromises, promise);
  });
}

Renderer.loadPartials = function(prefix, filter, cb) {
  if (arguments.length === 1) {
    filter = prefix;
    prefix = "";
  }
  
  var promise = validateGlobFilter(filter)
  .then(globAsync)
  .bind(this)
  .each(function(helper) {
    var match = helper.match(/\/([^\/]*)\.mustache$/);
    return this.loadPartial(helper, S(match[1]).camelize().s, prefix); 
  });
 
  //we need to wait untill all partials are loaded
  this._registerWaitingPromise(promise);
};


Renderer.loadPartial = function(path, name, prefix) {
  return fs.readFileAsync(path)
  .then(function(data) {
    Handlebars.registerPartial(prefix + name, String(data));
  });
};


Renderer.loadHelpers = function(filter) {
  
  var promise = validateGlobFilter(filter)
  .then(globAsync)
  .bind(this)
  .each(function(helper) {
    var match = helper.match(/\/([^\/]*)\.js$/);
    return this.loadHelper(helper, S(match[1]).camelize().s);
  });
  
  //we need to wait until all helpers are loaded
  this._registerWaitingPromise(promise);
};

Renderer.loadHelper = function(path, name) {
  return new Promise((function(resolve, reject) {
    try {
      if (this.loadedHelpers[name]) {
        if (this.loadedHelpers[name] !== path) {
          console.warn(name + " overwritten by: " + path);
        };
      } else {
        this.loadedHelpers[name] = path;
        Handlebars.registerHelper(name, require(path));
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  }).bind(this));
}

//TODO cache templates (with sopport to clear templates)
function getTemplates(tpls) {
  var keys = Object.keys(tpls),
      loadList = [];
  
  return Promise.resolve(keys)
  .map(function(name) {
    return getTemplate(tpls[name]);
  })
  .then(function(result) {
    var list = {};
    
    result.forEach(function(value, idx) {
      list[keys[idx]] = value;
    });
    
    return list;
  });
}


function getTemplate(path) {
  return fs.readFileAsync(path)
  .then(function(data) {
    return Handlebars.compile(String(data));
  });
}


Renderer.setup = function(options) {
  console.warn('deprecated: handlebars-renderer.setup() not required anymore');
};

//load default helpers
Renderer.loadHelpers(__dirname + "/lib/helpers/*.js");

Renderer.__express = function(path, opt, cb) {
  var pTemplates = getTemplates({
    layout: opt.settings.layouts + "/" + (opt.settings.layout || 'main') + ".mustache",
    content: path
  });

  //TODO what why the slice(0) whats the purpose of this?????
  var promises = Renderer._waitingPromises.slice(0);
  
  //TODO what is done here we wait or the tempaltes but still what is going on here???
  promises.unshift(pTemplates);

  Promise.all(promises)
  .get(0)
  .then(function(tpls) {
    opt.bodyContent = new Handlebars.SafeString(tpls.content(opt));
    cb(null, tpls.layout(opt));
  })
  .catch(function(e) {
    cb(e);
  })
  .done();
};

module.exports = Renderer;
