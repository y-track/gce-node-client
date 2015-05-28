var core = require('./core'),
    disks = require('./disks'),
    zones = require('./zones');

module.exports = {
    disks: core.generateFunctions(disks.routes),
    zones: core.generateFunctions(zones.routes),
    getToken: core.getToken,
    configure: core.configure
};