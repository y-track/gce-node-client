var core = require('./core'),
    disks = require('./disks'),
    instances = require('./instances'),
    machineTypes = require('./machineTypes'),
    diskTypes = require('./diskTypes'),
    zones = require('./zones');

module.exports = {
	instances: core.generateFunctions(instances.routes),
    disks: core.generateFunctions(disks.routes),
    zones: core.generateFunctions(zones.routes),
    machineTypes: core.generateFunctions(machineTypes.routes),
    diskTypes: core.generateFunctions(diskTypes.routes),
    getToken: core.getToken,
    configure: core.configure
};