var sdk = require('./sdk');

	// var ERROR represents the single error that will be thrown in case of problem
var ERROR = new Error("Error. Please retry with valid parameters [type, account_id, machine_type, dedicated, replicated]");

	// var types represents the instance types
var types = ['ddf','exposed','seg','visitor'],
	// var instance represents the instance that will be created (loaded async)
	instance = {},
	// var machineTypes represents the different machineTypes allowed in the prompte parameters (loaded async)
	machineTypes = {};

/**
* Check for the existence of an element (instance, disk), depending on its name
*
* @return {Promise} 
*/
function checkExistence(elementType){
	return new Promise(function(fulfill, reject){

		sdk[elementType].get({project: instance.project, zone: instance.zone, element: instance.name}).then(function(existingInstance){
			return fulfill(JSON.parse(existingInstance));
		}).catch(function(err){
			if(err.hasOwnProperty('statusCode') && err.statusCode == 404){
				return fulfill(false);
			} else {
				throw err;
			}
		});
	});
}

/**
* Wait for the completion of an instance deletion
*
* @return {Promise} function looping until the instance is deleted 
*/
function waitForInstance(){
	return new Promise(function(fulfill, reject){
		checkExistence('instances').then(function(existingInstance){
			setTimeout(function(){
				return fulfill( (existingInstance) ? waitForInstance() : false );
			}, 3000);
		});
	});
}

/**
* Delete an already existing instance
*
* @param {object} existingInstance Instance already existing
* @return {Promise} function that will delete the instance 
*/
function deleteExistingInstance(existingInstance){
	return sdk.instances.delete({project: instance.project, zone: instance.zone, instance: instance.name}).then(function(e){
		console.log(e);
		instance.disks[0].source = existingInstance.disks[0].source;
		return Promise.resolve();
	});
}

/**
* Control the validity of the arguments
*
* @param {array} params Parameters sent by prompt
*/
var hasValidArguments = function(params){

	var hasValidArguments = ('undefined' !== typeof params);

	hasValidArguments = hasValidArguments
		&& params.hasOwnProperty('type') 
		&& params.hasOwnProperty('account_id')
		&& params.hasOwnProperty('machine_type')
		&& params.hasOwnProperty('dedicated')
		&& params.hasOwnProperty('replicated');

	if(hasValidArguments){
		hasValidArguments = (machineTypes.hasOwnProperty(params.machine_type))
			&& (types.indexOf(params.type) > -1)
			&& (('1' === params.dedicated) || ('0' === params.dedicated) )
			&& (('1' === params.replicated) || ('0' === params.replicated) )
			&& ('1' === params.dedicated); // Will change
	}

	if('undefined' !== typeof params.canIpForward){
		hasValidArguments = (('1' === params.canIpForward) || ('0' === params.canIpForward));
	}

	if(!hasValidArguments){
		throw ERROR;
	}
};

/**
* Create an instance template
*
* @param {object} options The instance parameters
*/
var createInstanceTemplate = function(options){
	instance = {
		zone: options.zone, 
		name: options.prefix + '-api-db' + options.type + '-' + options.account_id + '-'+'a', 
		description: options.description || '',
		tags: {
			items: [
				'puppet-agent',
	            'zabbix-agent',
	            'live-api'
	        ]
		},
		machineType: 'https://www.googleapis.com/compute/v1/projects/' + options.project + '/zones/' + options.zone + '/machineTypes/' + options.machine_type,
		canIpForward: ('1' === options.can_ip_forward) ? true : false,
		networkInterfaces: [{
			network: 'https://www.googleapis.com/compute/v1/projects/' + options.project + '/global/networks/' + options.network
		}],
		disks: [{ boot: true }],
		metadata: {
			items: [
				{
					key: 'dmp_env',
					value: options.dmp_env
				},
				{
					key: 'account_id',
					value: options.account_id
				},
				{
					key: 'role',
					value: 'db' + options.type + '-a'
				}
			]
		},
		serviceAccounts: options.serviceAccounts
	};
}

/**
* Create a new instance from the instance template previously generated
*
* @param {object} options Parameters ton configure the instance
* @return {Promise} 
*/
var createInstance = function(options){

	var process = Promise.resolve();

	checkExistence('instances').then(function(existingInstance){

		if(existingInstance){
			// If the instance already exists
			var existingMachineType = (instance.machineType.toUpperCase() === existingInstance.machineType.toUpperCase());

			if(existingMachineType){
				// If the machine type already exists
				throw ERROR;
			} else {
				// If the machine type does not exist
				process = deleteExistingInstance(existingInstance).then(function(){
					return Promise.resolve();
				});
			}

		} else {
			// If the instance does not exist
			process = checkExistence('disks').then(function(existingDisk){

				if(existingDisk){
					// If the disk already exists
					instance.disks[0].source = existingDisk.selfLink;
				} else {
					// If the disk does not exist
					instance.disks[0].initializeParams = {
						sourceImage: options.source_image,
						diskSizeGb: options.disk_size
					};
				}

				return Promise.resolve();
			});
		}

		return process;
		
	}).then(function(){
		// Wait for the instance to be deleted
		waitForInstance().then(function(existingInstance){
			// Create the instance
			sdk.instances.create(instance).then(function(data){
				console.log(data);
			});
		});

	}).catch(function(err){
		console.error(err);
	});
};

/**
* Deduce the disk_size, the index and the scopes if options are valids
* 
* @param {object} options Main options for the creation of a template instance
*/
var deduceParameters = function(options){
	var params = {
		disk_size: Math.ceil(machineTypes[options.machine_type]*2 + 10),
		index: ('1' === options.replicated) ? ['a', 'b'] : ['a'],
		serviceAccounts: ("DDF" === options.type.toUpperCase() || "EXPOSED" === options.type.toUpperCase()) 
			? [{email: options.email, scopes: [options.scope]}] 
			: []
	};
	return JSON.parse( (JSON.stringify(options) + JSON.stringify(params)).replace(/}{/g, ",") );
}

/**
* Init the manager, setting the options for the instance creation
*
* @param {object} options Parameters ton configure the instance
* @return {Promise} 
*/
var init = function(options){

	// Set project and token
	sdk.configure({
	    token: options.token,
	    project: options.project
	});

	return sdk.machineTypes.list({project: options.project, zone: options.zone}).then(function (machineTypesData) {

		// Receive machine types data from Google
		JSON.parse(machineTypesData).items.forEach(function(e){
			machineTypes[e.name] = e.memoryMb/1000;
		});

		return Promise.resolve();
	});
};

/**
* Exports the different methods / variables
*/
module.exports = {
	init: init,
	deduceParameters: deduceParameters,
	hasValidArguments: hasValidArguments,
	createInstanceTemplate: createInstanceTemplate,
	createInstance: createInstance
};
