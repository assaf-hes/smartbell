const express = require('express');
var path = require('path');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

var server = require('http').Server(app);
var io = require('socket.io')(server);

//IP Address
//var ipExtern = '192.168.1.127';
var ipExtern = '192.168.43.153';

app.use(express.static(path.join(__dirname, '/../smartbell/www', '/../staff/www')));
app.use(bodyParser.json());

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

//Require Database
Beacon = require('./models/beacon');
StaffBeacon = require('./models/staff');
Alerts = require('./models/alerts');

// Connect to Mongoose
mongoose.connect('mongodb://localhost/beaconstore');
var db = mongoose.connection;

app.get('/', (req, res) => {
	res.send('Please use /api/beacons or /api/staffbeacons /api/alerts');
});

//Staff API
app.get('/api/staffbeacons', (req, res) => {
	StaffBeacon.getBeacons((err, beacons) => {
		if(err){
			throw err;
		}
		res.json(beacons);
	});
});

app.get('/api/staffbeacons/:_id', (req, res) => {
	StaffBeacon.getBeaconById(req.params._id, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

app.post('/api/staffbeacons', (req, res) => {
	var beacon = req.body;
	StaffBeacon.addBeacon(beacon, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

app.put('/api/staffbeacons/:_id', (req, res) => {
	var id = req.params._id;
	var beacon = req.body;
	StaffBeacon.updateBeacon(id, beacon, {}, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

app.delete('/api/staffbeacons/:_id', (req, res) => {
	var id = req.params._id;
	StaffBeacon.removeBeacon(id, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

// Alert API
app.get('/api/alerts', (req, res) => {
	Alerts.getAlerts((err, alerts) => {
		if(err){
			throw err;
		}
		res.json(alerts);
	});
});

//Get the latest alert by idPatient
app.get('/api/alerts/:idPatient', (req, res) => {

	Alerts.getAlertById(req.params.idPatient, (err, alert) => {
		if(err){
			throw err;
		}
		res.json(alert);
	});
});

app.post('/api/alerts', (req, res) => {
	var alert = req.body;
	Alerts.addAlert(alert, (err, alert) => {
		if(err){
			throw err;
		}
		res.json(alert);
	});
});

app.put('/api/alerts/:_id', (req, res) => {
	var id = req.params._id;
	var alert = req.body;
	Alerts.updateAlert(id, alert, {}, (err, alert) => {
		if(err){
			throw err;
		}
		res.json(alert);
	});
});

app.delete('/api/alerts/:_id', (req, res) => {
	var id = req.params._id;
	Alerts.removeAlert(id, (err, alert) => {
		if(err){
			throw err;
		}
		res.json(alert);
	});
});

// Patient API
app.get('/api/beacons', (req, res) => {
	Beacon.getBeacons((err, beacons) => {
		if(err){
			throw err;
		}
		res.json(beacons);
	});
});

app.get('/api/beacons/:_id', (req, res) => {
	Beacon.getBeaconById(req.params._id, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

app.post('/api/beacons', (req, res) => {
	var beacon = req.body;
	Beacon.addBeacon(beacon, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

app.put('/api/beacons/:_id', (req, res) => {
	var id = req.params._id;
	var beacon = req.body;
	Beacon.updateBeacon(id, beacon, {}, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

app.delete('/api/beacons/:_id', (req, res) => {
	var id = req.params._id;
	Beacon.removeBeacon(id, (err, beacon) => {
		if(err){
			throw err;
		}
		res.json(beacon);
	});
});

//Socket connecting and listening
io.on('connection', function(socket) {
	console.log('socket: someone is connected');

	socket.on('disconnect', function() {
		console.log('socket: someone is disconnected');
	});

	//Socket from patient
	socket.on('new-alert-from-patient', function(data) {
		console.log('new-alert-from-patient...!');
		//Emit notification
    	io.emit('notification', data.codeMessage);
    	console.log(JSON.stringify(data.codeMessage));
	});

	//Socket from staff
	socket.on('staff-take-alert-coming-from-patient', function(data) {
		console.log('staff-take-alert-coming-from-patient...!');
		//Emit notification
    	io.emit('notification2', data);
    	console.log(JSON.stringify(data));
	});
});

//Server listening
server.listen(4000, ipExtern, function() {
	var port = server.address().port;
	console.log("Server listening on http://%s:%s", ipExtern, port);
});
