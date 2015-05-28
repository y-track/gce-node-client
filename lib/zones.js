var routes = {
    list: {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones';
        },
        required: ['project'],
        bodyParams: [],
        queryParams: ['project']
    },
    get: {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone
        },
        required: ['project', 'zone'],
        bodyParams: [],
        queryParams: ['project', 'zone']
    }
};

module.exports = {
    routes: routes
};