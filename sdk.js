var core = require('./core'),
    disks = require('./disks'),
    instances = require('./instances'),
    machineTypes = require('./machineTypes'),
    diskTypes = require('./diskTypes'),
    zones = require('./zones'),
    operations = require('./operations'),
    fs = require('fs'),
    request = require('request-promise'),
    sep = require('path').sep;

var refreshToken = function(options){
        
        return request({
            url: 'https://www.googleapis.com/oauth2/v3/token',
            method: 'POST',
            form: {
                client_id: options.client_id,
                client_secret: options.client_secret,
                refresh_token: options.refresh_token,
                grant_type: 'refresh_token'
            },
            json: true
        }).then(function(data){
            return Promise.resolve(data.access_token);
        });
}

var getLocalCredentials = function(){
  return new Promise(function (fulfill, reject){
    fs.readFile(process.env.HOME + sep + '.config' + sep + 'gcloud' + sep + 'credentials', 'utf8', function (err, res){
      if (err) reject(err);
      else fulfill(JSON.parse(res));
    });
  });
}

var getCredentialsFromMetadata = function(){
    return request({
        url: 'http://metadata/computeMetadata/v1/instance/service-accounts/default/token',
        method: 'GET',
        headers: {
            "Metadata-Flavor": "Google"
        }
    }).then(function(data){
        return Promise.resolve(JSON.parse(data));
    });
}

module.exports = {
	instances: core.generateFunctions(instances.routes),
    disks: core.generateFunctions(disks.routes),
    zones: core.generateFunctions(zones.routes),
    machineTypes: core.generateFunctions(machineTypes.routes),
    diskTypes: core.generateFunctions(diskTypes.routes),
    operations: core.generateFunctions(operations.routes),
    getToken: core.getToken,
    refreshToken: refreshToken,
    getCredentialsFromMetadata: getCredentialsFromMetadata,
    getLocalCredentials: getLocalCredentials,
    configure: core.configure
};