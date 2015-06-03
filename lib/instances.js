var routes = {
    list: {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone;
        },
        required: ['project', 'zone'],
        bodyParams: [],
        queryParams: ['project', 'zone']
    },
    get: {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/instances/' + opts.instance;
        },
        required: ['project', 'zone', 'instance'],
        bodyParams: [],
        queryParams: ['project', 'zone', 'instance']
    }, 
    create: {
        method: 'POST',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/instances';
        },
        required: ['project', 'zone', 'name', 'tags', 'canIpForward', 'disks', 'machineType', 'networkInterfaces', 'metadata', 'serviceAccounts'],
        bodyParams: ['name', 'tags', 'canIpForward', 'disks', 'machineType', 'networkInterfaces', 'metadata', 'serviceAccounts'],
        queryParams: ['project', 'zone']
    }
};

module.exports = {
    routes: routes
};