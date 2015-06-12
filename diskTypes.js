var routes = {
    list: {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/diskTypes';
        },
        required: ['project', 'zone'],
        bodyParams: [],
        queryParams: ['project', 'zone']
    },
    get: {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/diskTypes/' + opts.diskType;
        },
        required: ['project', 'zone', 'element'],
        bodyParams: [],
        queryParams: ['project', 'zone', 'element']
    }
};

module.exports = {
    routes: routes
};