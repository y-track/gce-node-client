var sdk = require('./lib/sdk'),
    auth_file = require('./formation');

sdk.getToken(auth_file.client_email,
    auth_file.private_key,
    'https://www.googleapis.com/auth/compute').then(function (data) {
        data = JSON.parse(data);
        sdk.configure({
            token: data.access_token,
            project: 'sage-collector-94908'
        });
        sdk.zones.get({zone: 'us-central1-f'}).then(function (data) {
            console.log(data);
        });
    }).catch(function (reason) {
        console.error(reason.message);
    });