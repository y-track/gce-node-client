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
            return "/" + opts.project + '/zones/' + opts.zone + '/disks/' + opts.element
        },
        required: ['project', 'zone', 'element'],
        bodyParams: [],
        queryParams: ['project', 'zone', 'element']
    },
    'create': {
        method: 'POST',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/disks';
        },
        required: ['project', 'zone', 'name', 'sourceImage'],
        bodyParams: ['name', 'sourceImage'],
        queryParams: ['project', 'zone']
    }
};

module.exports = {
    routes: routes
};