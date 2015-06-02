var core = require('./core'),
    disks = require('./disks'),
    instances = require('./instances'),
    zones = require('./zones');

module.exports = {
	instances: core.generateFunctions(instances.routes),
    disks: core.generateFunctions(disks.routes),
    zones: core.generateFunctions(zones.routes),
    getToken: core.getToken,
    configure: core.configure
};