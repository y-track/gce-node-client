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
            return "/" + opts.project + '/zones/' + opts.zone + '/instances/' + opts.instance
        },
        required: ['project', 'zone', 'instance'],
        bodyParams: [],
        queryParams: ['project', 'zone', 'instance']
    }
};

module.exports = {
    routes: routes
};