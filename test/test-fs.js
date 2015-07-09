function fsMock(){
	this.associations = {};
}

fsMock.prototype.readFile = function(path, charset, callback){
	callback(undefined, JSON.stringify(this.associations[path]));
};

fsMock.prototype.expect = function(value, expected){
	this.associations[value] = expected;
	return this;
};