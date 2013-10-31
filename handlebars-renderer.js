var when = require('when'),
    fs = require('fs');

exports.setup = function(options) {
    options = options || {};
    var Handlebars = options.Handlebars || require('handlebars');

    //TODO add support for an asset module (prefixing of url)

    Handlebars.registerHelper('appendAsset', function(url) {
        this._assets = this._assets || [];
        this._assets.push(url);
        return "";
    });

    Handlebars.registerHelper('prependAsset', function(url) {
        this._assets = this._assets || [];
        this._assets.unshift(url);
        return "";
    });

    Handlebars.registerHelper('includeAssets', function() {
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
    });

    render = function(path, opt, cb) {

        //TODO allow to define the default layout (via options)
        //     and an alternative layout via 
        when(getTemplates({
            layout: opt.settings.views + "/layout.mustache",
            content: path
        })).then(function(tpls) {
            try {
                opt.bodyContent = tpls.content(opt);

                var complete = tpls.layout(opt);
                cb(null, complete);
            } catch (e) {
                cb(e);
            }
        });
    };


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
};

var render = function() {
    throw new Error("renderer was not setup call 'setup()'");
};

exports.__express = function() {
    render.apply(this, arguments);
};