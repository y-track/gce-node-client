var crypto = require('crypto'),
    base64url = require('base64url'),
    deepExtend = require('deep-extend'),
    sep = require('path').sep,
    Promise = require('es6-promise').Promise,
    nock = require('nock'),
    bunyan = require('bunyan'),
    log = bunyan.createLogger({
        name: 'logger',
        level: 'trace'
    });

function CORE(request, fs, host, metaHost){
    this.host = host;
    this.metaHost = metaHost;
    this.request = request || require('request-promise');
    this.fs = fs || require('fs');
}

var query = function (route, o) {
    var opts = {}
    deepExtend(opts, o, options);
    for (var i in route.required) {
        if (!opts.hasOwnProperty(route.required[i])) { 
            throw new Error("Missing param " + route.required[i]);
        }
    }
    var body = {};
    if (route.method.toUpperCase() === "POST" || route.method.toUpperCase() === "PUT") {
        body = route.bodyParams.reduce(function (total, param) {
            if (opts[param]) {
                total[param] = opts[param];
            }
            return total;
        }, body);
    }

    var params = route.queryParams.reduce(function (total, param) {
        if (opts[param]) {
            total[param] = opts[param];
        }
        return total;
    }, {});

    var url = this.host + "/compute/v1/projects" + route.route(params);
    var req = (route.method.toUpperCase() === "POST")
    ? this.request({
        url: url,
        method: route.method,
        headers: {
            "Authorization": "Bearer " + opts.token
        },
        json: true,
        body: body
    })
    : this.request({
        url: url,
        method: route.method,
        headers: {
            "Authorization": "Bearer " + opts.token
        },
        form: body
    });
    log.info(url);
    return req;
};

var options = {};

CORE.prototype.generateFunctions = function (routes) {
    return Object.keys(routes).reduce((function (total, key) {
        total[key] = query.bind(this, routes[key]);
        return total;
    }).bind(this), {});
};

CORE.prototype.getToken = function (client_email, private_key, scope) {
    var header = JSON.stringify({"alg":"RS256","typ":"JWT"}),
        jwt = JSON.stringify({
            iss: client_email,
            scope: scope,
            aud: this.host + "/oauth2/v3/token",
            exp: Math.floor(new Date().getTime() / 1000) + 3600,
            iat: Math.floor(new Date().getTime() / 1000)
        });

    var header_64 = base64url(header);
    var jwt_64 = base64url(jwt);
        hash = crypto.createSign('RSA-SHA256');
    hash.update(header_64 + '.' + jwt_64);
    var sign_64 = hash.sign(private_key, 'base64');

    var line = header_64 + '.' + jwt_64 + '.' + sign_64;

    var url = this.host + "/oauth2/v3/token";

    return this.request({
        url: url,
        method: 'POST',
        form: {
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: line
        }
    });
};

CORE.prototype.refreshToken = function(options){
    console.log(this.host + '/oauth2/v3/token');
    return this.request({
        url: this.host + '/oauth2/v3/token',
        method: 'POST',
        form: {
            client_id: options.client_id,
            client_secret: options.client_secret,
            refresh_token: options.refresh_token,
            grant_type: 'refresh_token'
        },
        json: true
    }).then(function(data){
        log.info('ok2');
        return Promise.resolve(data.access_token);
    });
}

CORE.prototype.getLocalCredentials = function(){
    return new Promise((function (fulfill, reject){
        this.fs.readFile(process.env.HOME + sep + '.config' + sep + 'gcloud' + sep + 'credentials', 'utf8', function (err, res){
            if (err) {
            console.log(err);
                reject(err);
            } else {
                fulfill(JSON.parse(res));
            }
        });
    }).bind(this));
}

CORE.prototype.getCredentialsFromMetadata = function(){
    return this.request({
        url: 'http://' + this.metaHost + '/computeMetadata/v1/instance/service-accounts/default/token',
        method: 'GET',
        headers: {
            "Metadata-Flavor": "Google"
        }
    }).then(function(data){
        return Promise.resolve(JSON.parse(data));
    });
}

CORE.prototype.configure = function (opts) {
    options = opts;
};

module.exports = CORE;