var CORE = require('./core'),
    disks = require('./disks'),
    instances = require('./instances'),
    machineTypes = require('./machineTypes'),
    zones = require('./zones'),
    operations = require('./operations');

function SDK(request, fs, host, metaHost){
    this.core = new CORE(request, fs, host, metaHost);

    this.instances = this.core.generateFunctions(instances.routes);
    this.machineTypes = this.core.generateFunctions(machineTypes.routes);
    this.disks = this.core.generateFunctions(disks.routes);
    this.zones = this.core.generateFunctions(zones.routes);
    this.operations = this.core.generateFunctions(operations.routes);
}

SDK.prototype.getLocalCredentials = function(){
    return this.core.getLocalCredentials();
};

SDK.prototype.getCredentialsFromMetadata = function(){
    return this.core.getCredentialsFromMetadata();
};

SDK.prototype.getToken = function(){
    return this.core.getToken();
};

SDK.prototype.refreshToken = function(options){
    return this.core.refreshToken(options);
};

SDK.prototype.configure = function(options){
    this.core.configure(options);
}


module.exports = SDK;