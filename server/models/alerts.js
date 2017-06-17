const mongoose = require('mongoose');

// Alert Schema
const alertsSchema = mongoose.Schema({
	idPatient:{
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

const Alerts = module.exports = mongoose.model('Alerts', alertsSchema);

// Get Alerts
module.exports.getAlerts = (callback, limit) => {
	Alerts.find(callback).limit(limit);
}

//Get latest alert by idPatient (ex. id=1333)
module.exports.getAlertById = (id, callback) => {
	Alerts.find(id, callback).limit(1).sort({$natural:-1});
}

// Add Alert
module.exports.addAlert = (alert, callback) => {
	Alerts.create(alert, callback);
}

// Update Alert
module.exports.updateAlert = (id, alert, options, callback) => {
	var query = {_id: id};
	var update = {
		id: alert.id,
		idPatient: alert.idPatient,
		firstname: alert.firstname,
		name: alert.name,
		age: alert.age,
		room: alert.room,
		message: alert.message,
		codeMessage: alert.codeMessage
	}
	Alerts.findOneAndUpdate(query, update, options, callback);
}

// Delete Alert
module.exports.removeAlert = (id, callback) => {
	var query = {_id: id};
	Alerts.remove(query, callback);
}

//Find all alerts
module.exports.getAllAlerts = (callback, limit) => {
	Alerts.find(callback).limit(limit);
}

