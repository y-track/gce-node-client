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
            return "/" + opts.project + '/zones/' + opts.element
        },
        required: ['project', 'element'],
        bodyParams: [],
        queryParams: ['project', 'element']
    }
};

module.exports = {
    routes: routes
};