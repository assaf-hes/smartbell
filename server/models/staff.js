const mongoose = require('mongoose');

// Staff Schema
// staffRole: 0=Doctor, 1=Nurse, 2=Assistance
const staffBeaconSchema = mongoose.Schema({
	idStaff:{
		type: String,
		required: true
	},
	staffRole:{
		type: String
	},
	staffRoleCode:{
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
	responseToAlert:{
		type: String
	},
	create_date:{
		type: Date,
		default: Date.now
	}
});

const StaffBeacon = module.exports = mongoose.model('StaffBeacon', staffBeaconSchema);

// Get all StaffBeacon
module.exports.getBeacons = (callback, limit) => {
	StaffBeacon.find(callback).limit(limit);
}

// Get StaffBeacon
module.exports.getBeaconById = (id, callback) => {
	StaffBeacon.findById(id, callback);
}

// Add StaffBeacon
module.exports.addBeacon = (beacon, callback) => {
	StaffBeacon.create(beacon, callback);
}

// Update StaffBeacon
module.exports.updateBeacon = (id, beacon, options, callback) => {
	var query = {_id: id};
	var update = {
		id: beacon.id,
		idStaff: beacon.idStaff,
		staffRole: beacon.staffRole,
		staffRoleCode: beacon.staffRoleCode,
		uuid: beacon.uuid,
		major: beacon.major,
		minor: beacon.minor,
		proximity: beacon.proximity,
		rssi: beacon.rssi,
		tx: beacon.tx,
		accuracy: beacon.accuracy,
		firstname: beacon.firstname,
		name: beacon.name,
		responseToAlert: beacon.responseToAlert
	}
	StaffBeacon.findOneAndUpdate(query, update, options, callback);
}

// Delete Beacon
module.exports.removeBeacon = (id, callback) => {
	var query = {_id: id};
	StaffBeacon.remove(query, callback);
}

//Find all staff
module.exports.getStaff = (callback, limit) => {
	StaffBeacon.find(callback).limit(limit);
}
