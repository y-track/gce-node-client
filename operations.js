var routes = {
    get: {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/operations/' + opts.element;
        },
        required: ['project', 'zone', 'element'],
        bodyParams: [],
        queryParams: ['project', 'zone', 'element']
    }
};

module.exports = {
    routes: routes
};