var routes = {
    'list': {
        method: 'GET',
        route: function (opts) {
            return "/" + opts.project + '/zones/' + opts.zone + '/disks'
        },
        required: ['project', 'zone']
    }
};

module.exports = {
    routes: routes
};