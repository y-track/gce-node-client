var routes = {
    'list': {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/disks';
        },
        required: ['project', 'zone'],
        bodyParams: [],
        queryParams: ['project', 'zone']
    },
    'get': {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/disks/' + opts.disk
        },
        required: ['project', 'zone', 'disk'],
        bodyParams: [],
        queryParams: ['project', 'zone', 'disk']
    },
    'create': {
        method: 'POST',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/disks';
        },
        required: ['project', 'zone', 'name', 'machineType', 'sourceImage'],
        bodyParams: ['name', 'machineType', 'sourceImage'],
        queryParams: ['project', 'zone']
    }
};

module.exports = {
    routes: routes
};