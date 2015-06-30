var SDK = require('../sdk'),
	assert = require('assert'),
	nock = require('nock'),
	sep = require('path').sep,
	request = require('request-promise');

var FSMOCK = require('./test-fs');

describe('Credentials', function(){

	describe('#getCredentialsFromMetadata', function(){

		var res = undefined;

		nock('http://metadata')
			.get('/computeMetadata/v1/instance/service-accounts/default/token')
			.reply(200, require('./Fixtures/request/getCredentialsFromMetadata-01.json'));

		it('should get a response when requesting', function(done){

			var sdk = new SDK();

			sdk.getCredentialsFromMetadata().then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			});

		});

		it('should get valid JSON object', function(done){
			assert.equal('object', typeof res);
			done();
		});

		it('should get a valid access token', function(done){
			assert.equal('access-token-default-refreshed', res.access_token);
			done();
		});

		it('should return the expected response', function(done){
			assert.deepEqual(require('./Fixtures/request/getCredentialsFromMetadata-01.json'), res);
			done();
		});

	});

	describe('#getLocalCredentials()', function(){

		var res = undefined;

		it('should find a credentials file', function(done){

			var fsMock = new FSMOCK(),
				sdk = new SDK(undefined, fsMock);

			fsMock
				.expect(process.env.HOME + sep + '.config' + sep + 'gcloud' + sep + 'credentials', require('./Fixtures/fs/getLocalCredentials-01.json'));

			sdk.getLocalCredentials().then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			});

		});

		it('should get valid JSON object', function(done){
			assert.equal('object', typeof res);
			done();
		});

		it('should find a default account', function(done){
			var found = false;
			res.data.forEach(function(e){
                if('default' === e.key.account){
                	res = e;
                    found = true;
                }
            });
			done((found) ? undefined : new Error('There is no default account'));
		});

		it('should get a valid refresh token', function(done){
			assert.equal('refresh-token-default', res.credential.refresh_token);
			done();
		});

		it('should get a valid client id', function(done){
			assert.equal('client-id-default', res.credential.client_id);
			done();
		});

		it('should get a valid client secret', function(done){
			assert.equal('client-secret-default', res.credential.client_secret);
			done();
		});

	});

	describe('#refreshToken', function(){

		var res = undefined;

		it('should get a response when requesting', function(done){

			var sdk = new SDK();

			nock('https://www.googleapis.com')
				.post('/oauth2/v3/token', "client_id=client-id-default&client_secret=client-secret-default&refresh_token=refresh-token-default&grant_type=refresh_token")
				.reply(200, require('./Fixtures/request/refreshToken-01.json'));

			sdk.refreshToken({
				client_id: 'client-id-default', 
				client_secret: 'client-secret-default', 
				refresh_token: 'refresh-token-default'
			}).then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			})
		});

		it('should get a valid string', function(done){
			assert.equal('string', typeof res);
			done();
		});

		it('should get a valid access token when refreshed', function(done){
			assert.equal('access-token-default-refreshed', res);
			done();
		});

	});

});

describe('Instances', function(){

	describe('#list()', function(){
			
		var res = undefined;

		it('should return something', function(done){

			var sdk = new SDK();
			
			nock('https://www.googleapis.com')
				.get('/compute/v1/projects/project/zones/zone/instances')
				.reply(200, require('./Fixtures/request/instances-list-01.json'));

			sdk.configure({
				token: 'access-token-default',
				project: 'project'
			});

			sdk.instances.list({project: 'project', zone: 'zone'}).then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			});
		});

		it('should get a valid string', function(done){
			assert.equal('string', typeof res);
			done();
		});

		it('should be JSON parsable', function(done){
			try {
				res = JSON.parse(res);
				done();
			} catch(err) {
				done(err);
			}
		});

		it('should return a valid list of instances', function(done){
			assert.equal('compute#instanceList', res.kind);
			done();
		});

		it('should return an array fulled with instances', function(done){
			assert.equal(true, res.items.length > 0);
			done();
		});

		it('should return the expected list of instances', function(done){
			assert.deepEqual(require('./Fixtures/request/instances-list-01.json'), res);
			done();
		});

	});

	describe('#get()', function(){

		context('Instance exists', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/instances/dbddf')
					.reply(200, require('./Fixtures/request/instances-get-01.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.get({project: 'project', zone: 'zone', element: 'dbddf'}).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				});

			});

			it('should get a valid string', function(done){
				assert.equal('string', typeof res);
				done();
			});

			it('should be JSON parsable', function(done){
				try {
					res = JSON.parse(res);
					done();
				} catch(err) {
					done(err);
				}
			});

			it('should return a valid instance', function(done){
				assert.equal('compute#instance', res.kind);
				done();
			});

			it('should return the expected instance', function(done){
				assert.deepEqual(require('./Fixtures/request/instances-get-01.json'), res);
				done();
			});

		});

		context('Instance does not exist', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/instances/dbddf')
					.reply(404, require('./Fixtures/request/instances-get-02.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.get({project: 'project', zone: 'zone', element: 'dbddf'}).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				});

			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(JSON.stringify(require('./Fixtures/request/instances-get-02.json')), res.response.body);
				done();
			});


		});

	});

	describe('#create()', function(){

		var res = undefined;

		it('should return a result', function(done){

			var sdk = new SDK();
			
			nock('https://www.googleapis.com')
				.post('/compute/v1/projects/project/zones/zone/instances', require('./Fixtures/request/instances-create-01-postparams.json'))
				.reply(200, require('./Fixtures/request/instances-create-01.json'));

			sdk.configure({
				token: 'access-token-default',
				project: 'project'
			});

			sdk.instances.create(require('./Fixtures/request/instances-create-01-options.json')).then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			});

		});

		it('should return a valid JSON object', function(done){
			assert.equal('object', typeof res);
			done();
		});

		it('should return valid compute operation', function(done){
			assert.equal('compute#operation', res.kind);
			done();
		});

	});


	describe('#delete()', function(){

		var res = undefined;

		context('Instance exists', function(){

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.delete('/compute/v1/projects/project/zones/zone/instances/dbddf')
					.reply(200, require('./Fixtures/request/instances-delete-01.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.delete(require('./Fixtures/request/instances-delete-01-options.json')).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				})
			});

			it('should get a valid string', function(done){
				assert.equal('string', typeof res);
				done();
			});

			it('should be JSON parsable', function(done){
				try {
					res = JSON.parse(res);
					done();
				} catch(err) {
					done(err);
				}
			});

			it('should return valid compute operation', function(done){
				assert.equal('compute#operation', res.kind);
				done();
			});

			it('should return the expected compute operation', function(done){
				assert.deepEqual(require('./Fixtures/request/instances-delete-01.json'), res);
				done();
			});

		});

		context('Instance does not exist', function(){

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.delete('/compute/v1/projects/project/zones/zone/instances/dbddf')
					.reply(404, require('./Fixtures/request/instances-delete-02.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.delete(require('./Fixtures/request/instances-delete-02-options.json')).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				})
			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(JSON.stringify(require('./Fixtures/request/instances-delete-02.json')), res.response.body);
				done();
			});
		});

	});

	describe('#stop()', function(){

		var res = undefined;

		context('Instance exists', function(){

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com:443')
					.post('/compute/v1/projects/project/zones/zone/instances/dbddf/stop', require('./Fixtures/request/instances-stop-01-postparams.json'))
					.reply(200, require('./Fixtures/request/instances-stop-01.json'));


				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.stop(require('./Fixtures/request/instances-stop-01-options.json')).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				})
			});

			it('should return a valid JSON object', function(done){
				assert.equal('object', typeof res);
				done();
			});

			it('should return valid compute operation', function(done){
				assert.equal('compute#operation', res.kind);
				done();
			});

			it('should return the expected compute operation', function(done){
				assert.deepEqual(require('./Fixtures/request/instances-stop-01.json'), res);
				done();
			});

		});

		context('Instance does not exist', function(){

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com:443')
					.post('/compute/v1/projects/project/zones/zone/instances/dbddf/stop', require('./Fixtures/request/instances-stop-02-postparams.json'))
					.reply(404, require('./Fixtures/request/instances-stop-02.json'));


				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.stop(require('./Fixtures/request/instances-stop-02-options.json')).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				})
			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(require('./Fixtures/request/instances-stop-02.json'), res.response.body);
				done();
			});
		});

	});

	describe('#start()', function(){

		var res = undefined;

		context('Instance exists', function(){

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com:443')
					.post('/compute/v1/projects/project/zones/zone/instances/dbddf/start', require('./Fixtures/request/instances-start-01-postparams.json'))
					.reply(200, require('./Fixtures/request/instances-start-01.json'));


				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.start(require('./Fixtures/request/instances-start-01-options.json')).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				})
			});

			it('should return a valid JSON object', function(done){
				assert.equal('object', typeof res);
				done();
			});

			it('should return valid compute operation', function(done){
				assert.equal('compute#operation', res.kind);
				done();
			});
		});

		context('Instance does not exist', function(){

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com:443')
					.post('/compute/v1/projects/project/zones/zone/instances/dbddf/start', require('./Fixtures/request/instances-start-02-postparams.json'))
					.reply(404, require('./Fixtures/request/instances-start-02.json'));


				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.instances.start(require('./Fixtures/request/instances-start-02-options.json')).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				})
			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(require('./Fixtures/request/instances-start-02.json'), res.response.body);
				done();
			});
		});
	});

});

describe('Disks', function(){

	describe('#list()', function(){

		context('Send request', function(){
			
			var res = undefined;

			it('should return something', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/disks')
					.reply(200, require('./Fixtures/request/disks-list-01.json'));


				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.disks.list({project: 'project', zone: 'zone'}).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				});
			});

			it('should get a valid string', function(done){
				assert.equal('string', typeof res);
				done();
			});

			it('should be JSON parsable', function(done){
				try {
					res = JSON.parse(res);
					done();
				} catch(err) {
					done(err);
				}
			});

			it('should return a valid list of disks', function(done){
				assert.equal('compute#diskList', res.kind);
				done();
			});

			it('should return the expected list of disks', function(done){
				assert.deepEqual(require('./Fixtures/request/disks-list-01.json'), res);
				done();
			});

		});

		context('Disks exist', function(){

			var res = undefined;

			it('should return an array fulled with disks', function(done){
				
				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/disks')
					.reply(200, require('./Fixtures/request/disks-list-01.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.disks.list({project: 'project', zone: 'zone'}).then(function(data){

					assert.equal(true, JSON.parse(data).items.length > 0);
					done();
				}).catch(function(err){
					done(err);
				});

			});
		});

		context('Disks do not exist', function(){

			var res = undefined;

			it('should return an empty array of disks', function(done){
				
				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/disks')
					.reply(200, require('./Fixtures/request/disks-list-02.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.disks.list({project: 'project', zone: 'zone'}).then(function(data){
					assert.equal(0, JSON.parse(data).items.length);
					done();
				}).catch(function(err){
					done(err);
				});

			});
		})
	});

	describe('#get()', function(){

		context('Disk exists', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/disks/dbddf')
					.reply(200, require('./Fixtures/request/disks-get-01.json'));


				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.disks.get({project: 'project', zone: 'zone', element: 'dbddf'}).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				});

			});

			it('should get a valid string', function(done){
				assert.equal('string', typeof res);
				done();
			});

			it('should be JSON parsable', function(done){
				try {
					res = JSON.parse(res);
					done();
				} catch(err) {
					done(err);
				}
			});

			it('should return a valid disk', function(done){
				assert.equal('compute#disk', res.kind);
				done();
			});

			it('should return the expected disk', function(done){
				assert.deepEqual(require('./Fixtures/request/disks-get-01.json'), res);
				done();
			});

		});

		context('Disk does not exist', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/disks/dbddf')
					.reply(404, require('./Fixtures/request/disks-get-02.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.disks.get({project: 'project', zone: 'zone', element: 'dbddf'}).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				});

			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(JSON.stringify(require('./Fixtures/request/disks-get-02.json')), res.response.body);
				done();
			});


		});
	});
	
	describe('#create()', function(){

		var res = undefined;

		it('should return a result', function(done){

			var sdk = new SDK();

			nock('https://www.googleapis.com')
				.post('/compute/v1/projects/project/zones/zone/disks', {"name":"new-disk","sourceImage":"source-image"})
				.reply(200, require('./Fixtures/request/disks-create-01.json'));

			sdk.configure({
				token: 'access-token-default',
				project: 'project'
			});

			sdk.disks.create({project: 'project', zone: 'zone', name: 'new-disk', sourceImage: 'source-image'}).then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			});
		});


		it('should return a valid JSON object', function(done){
			assert.equal('object', typeof res);
			done();
		});

		it('should return valid compute operation', function(done){
			assert.equal('compute#operation', res.kind);
			done();
		});

		it('should return the expected compute operation', function(done){
			assert.deepEqual(require('./Fixtures/request/disks-create-01.json'), res);
			done();
		});
	});
});

describe('Zones', function(){

	describe('#list()', function(){

		var res = undefined;

		it('should return something', function(done){

			var sdk = new SDK();
			
			nock('https://www.googleapis.com')
				.get('/compute/v1/projects/project/zones')
				.reply(200, require('./Fixtures/request/zones-list-01.json'));


			sdk.configure({
				token: 'access-token-default',
				project: 'project'
			});

			sdk.zones.list({project: 'project'}).then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			});
		});

		it('should get a valid string', function(done){
			assert.equal('string', typeof res);
			done();
		});

		it('should be JSON parsable', function(done){
			try {
				res = JSON.parse(res);
				done();
			} catch(err) {
				done(err);
			}
		});

		it('should return a valid list of zones', function(done){
			assert.equal('compute#zoneList', res.kind);
			done();
		});

		it('should return the expected list of zones', function(done){
			assert.deepEqual(require('./Fixtures/request/zones-list-01.json'), res);
			done();
		});
	});


	describe('#get()', function(){

		context('Zone exists', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone')
					.reply(200, require('./Fixtures/request/zones-get-01.json'));



				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.zones.get({project: 'project', element: 'zone'}).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				});

			});

			it('should get a valid string', function(done){
				assert.equal('string', typeof res);
				done();
			});

			it('should be JSON parsable', function(done){
				try {
					res = JSON.parse(res);
					done();
				} catch(err) {
					done(err);
				}
			});

			it('should return a valid zone', function(done){
				assert.equal('compute#zone', res.kind);
				done();
			});

			it('should return the expected zone', function(done){
				assert.deepEqual(require('./Fixtures/request/zones-get-01.json'), res);
				done();
			});

		});

		context('Zone does not exist', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone')
					.reply(404, require('./Fixtures/request/zones-get-02.json'));


				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.zones.get({project: 'project', element: 'zone'}).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				});

			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(JSON.stringify(require('./Fixtures/request/zones-get-02.json')), res.response.body);
				done();
			});


		});
	});

});

describe('Operations', function(){

	describe('#get()', function(){

		context('Operation exists', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/operations/operation')
					.reply(200, require('./Fixtures/request/operations-get-01.json'));




				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.operations.get({project: 'project', zone: 'zone', element: 'operation'}).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				});

			});

			it('should get a valid string', function(done){
				assert.equal('string', typeof res);
				done();
			});

			it('should be JSON parsable', function(done){
				try {
					res = JSON.parse(res);
					done();
				} catch(err) {
					done(err);
				}
			});

			it('should return a valid operation', function(done){
				assert.equal('compute#operation', res.kind);
				done();
			});

			it('should return the expected operation', function(done){
				assert.deepEqual(require('./Fixtures/request/operations-get-01.json'), res);
				done();
			});

		});

		context('Operation does not exist', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/operations/operation')
					.reply(404, require('./Fixtures/request/operations-get-02.json'));



				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.operations.get({project: 'project', zone: 'zone', element: 'operation'}).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				});

			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(JSON.stringify(require('./Fixtures/request/operations-get-02.json')), res.response.body);
				done();
			});


		});
	});
});

describe('Machine Types', function(){

	describe('#list()', function(){

		var res = undefined;

		it('should return something', function(done){

			var sdk = new SDK();
			
			nock('https://www.googleapis.com')
				.get('/compute/v1/projects/project/zones/zone/machineTypes')
				.reply(200, require('./Fixtures/request/machineTypes-list-01.json'));

			sdk.configure({
				token: 'access-token-default',
				project: 'project'
			});

			sdk.machineTypes.list({project: 'project', zone: 'zone'}).then(function(data){
				res = data;
				done();
			}).catch(function(err){
				done(err);
			});
		});

		it('should get a valid string', function(done){
			assert.equal('string', typeof res);
			done();
		});

		it('should be JSON parsable', function(done){
			try {
				res = JSON.parse(res);
				done();
			} catch(err) {
				done(err);
			}
		});

		it('should return a valid list of machine types', function(done){
			assert.equal('compute#machineTypeList', res.kind);
			done();
		});

		it('should return the expected list of machine types', function(done){
			assert.deepEqual(require('./Fixtures/request/machineTypes-list-01.json'), res);
			done();
		});
	});

	describe('#get()', function(){

		context('Machine type exists', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/machineTypes/machineType')
					.reply(200, require('./Fixtures/request/machineTypes-get-01.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.machineTypes.get({project: 'project', zone: 'zone', element: 'machineType'}).then(function(data){
					res = data;
					done();
				}).catch(function(err){
					done(err);
				});

			});

			it('should get a valid string', function(done){
				assert.equal('string', typeof res);
				done();
			});

			it('should be JSON parsable', function(done){
				try {
					res = JSON.parse(res);
					done();
				} catch(err) {
					done(err);
				}
			});

			it('should return a valid machine Type', function(done){
				assert.equal('compute#machineType', res.kind);
				done();
			});

			it('should return the expected machine Type', function(done){
				assert.deepEqual(require('./Fixtures/request/machineTypes-get-01.json'), res);
				done();
			});

		});

		context('Machine type does not exist', function(){

			var res = undefined;

			it('should return a result', function(done){

				var sdk = new SDK();
				
				nock('https://www.googleapis.com')
					.get('/compute/v1/projects/project/zones/zone/machineTypes/machineType')
					.reply(404, require('./Fixtures/request/machineTypes-get-02.json'));

				sdk.configure({
					token: 'access-token-default',
					project: 'project'
				});

				sdk.machineTypes.get({project: 'project', zone: 'zone', element: 'machineType'}).then(function(data){
					done(new Error('the request should return a 404 error'));
				}).catch(function(data){
					res = data;
					done();
				});

			});

			it('should return an Error object', function(done){
				assert.equal('StatusCodeError', res.constructor.name);
				done();
			});

			it('should return a 404 StatusCodeError', function(done){
				assert.equal(404, res.statusCode);
				done();
			});

			it('should return the expected error', function(done){
				assert.deepEqual(JSON.stringify(require('./Fixtures/request/machineTypes-get-02.json')), res.response.body);
				done();
			});

		});
	});
});