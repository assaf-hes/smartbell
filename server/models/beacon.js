const mongoose = require('mongoose');

// Beacon Schema
const beaconSchema = mongoose.Schema({
	idPatient:{
		type: String
	},
	uuid:{
		type: String
	},
	major:{
		type: String
	},
	minor:{
		type: String
	},
	proximity:{
		type: String
	},
	rssi:{
		type: String
	},
	tx:{
		type: String
	},
	accuracy:{
		type: String
	},
	firstname:{
		type: String
	},
	name:{
		type: String
	},
	age:{
		type: String
	},
	room:{
		type: String
	},
	message:{
		type: String
	},
	codeMessage:{
		type: String
	},
	create_date:{
		type: Date,
		default: Date.now
	}
});

const Beacon = module.exports = mongoose.model('Beacon', beaconSchema);

// Get Beacons
module.exports.getBeacons = (callback, limit) => {
	Beacon.find(callback).limit(limit);
}

// Get Beacon
module.exports.getBeaconById = (id, callback) => {
	Beacon.findById(id, callback);
}

// Add Beacon
module.exports.addBeacon = (beacon, callback) => {
	Beacon.create(beacon, callback);
}

// Update Beacon
module.exports.updateBeacon = (id, beacon, options, callback) => {
	var query = {_id: id};
	var update = {
		id: beacon.id,
		idPatient: beacon.idPatient,
		uuid: beacon.uuid,
		major: beacon.major,
		minor: beacon.minor,
		proximity: beacon.proximity,
		rssi: beacon.rssi,
		tx: beacon.tx,
		accuracy: beacon.accuracy,
		firstname: beacon.firstname,
		name: beacon.name,
		age: beacon.age,
		room: beacon.room,
		message: beacon.message,
		codeMessage: beacon.codeMessage
	}
	Beacon.findOneAndUpdate(query, update, options, callback);
}

// Delete Beacon
module.exports.removeBeacon = (id, callback) => {
	var query = {_id: id};
	Beacon.remove(query, callback);
}
