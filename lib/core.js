var request = require('request-promise'),
    crypto = require('crypto'),
    base64url = require('base64url'),
    deepExtend = require('deep-extend');

var query = function (route, o) {
    var opts = {}
    deepExtend(opts, o, options);
    for (var i in route.required) {
        if (!opts[route.required[i]]) {
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

    var url = "https://www.googleapis.com/compute/v1/projects" + route.route(params);

    return request({
        url: url,
        method: route.method,
        headers: {
            "Authorization": "Bearer " + opts.token
        },
        form: body
    });
};

var options = {};

module.exports.generateFunctions = function (routes) {
    return Object.keys(routes).reduce(function (total, key) {
        total[key] = query.bind(this, routes[key]);
        return total;
    }, {});
};

module.exports.getToken = function (client_email, private_key, scope) {
    var header = JSON.stringify({"alg":"RS256","typ":"JWT"}),
        jwt = JSON.stringify({
            iss: client_email,
            scope: scope,
            aud: "https://www.googleapis.com/oauth2/v3/token",
            exp: Math.floor(new Date().getTime() / 1000) + 3600,
            iat: Math.floor(new Date().getTime() / 1000)
        });

    var header_64 = base64url(header);
    var jwt_64 = base64url(jwt);
        hash = crypto.createSign('RSA-SHA256');
    hash.update(header_64 + '.' + jwt_64);
    var sign_64 = hash.sign(private_key, 'base64');

    var line = header_64 + '.' + jwt_64 + '.' + sign_64;

    var url = "https://www.googleapis.com/oauth2/v3/token";

    return request({
        url: url,
        method: 'POST',
        form: {
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: line
        }
    });
};

module.exports.configure = function (opts) {
    options = opts;
};