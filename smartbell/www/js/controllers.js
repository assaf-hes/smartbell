angular.module('starter.controllers', [])

.controller('ManageDataCtrl', function($rootScope, $scope, $window, $timeout, $interval, $http, $location, $ionicPlatform, 
                                      $cordovaBeacon, SharedDataCtrl, SharedDataBeaconsController, servicesConfig, socket, 
                                      sessionService, $cordovaLocalNotification) {

  //Message from patient
  $scope.labelNurse = "I need a Nurse";
  $scope.labelDoctor = "I need a Doctor";
  $scope.labelSosEmergency = "SOS Emergency";
  $scope.labelPain = "I have pain...";
  $scope.labelEntertainment = "I need entertainment (TV, radio, PS3)";
  $scope.labelPiss = "I need to piss";
  $scope.labelPoo = "I need to do a poo...";
  $scope.labelEat = "I want to eat";

  //Environnement variables (ip address and port)
  $scope.ipAddress = servicesConfig.urlAPI;

  $scope.init = function() {
    $scope.getUserAuth();

    $timeout(function() { 
      $scope.initBeaconsPlugin();
    }, 
    1000);

    $timeout(function() { 
      $scope.getNearestBeacon();
    }, 
    3000);
  };

  $scope.$on('$ionicView.loaded', function() {
    $scope.init();
  });

  //Check if user has already scan his QR-Code and have his credentials in local storage
  $scope.getUserAuth = function() {

    if(sessionService.get("idPatient")) {
      $scope.idPatient = sessionService.get("idPatient");
      SharedDataBeaconsController.idPatient = $scope.idPatient;
    }
    if(sessionService.get("firstname")) {
      $scope.firstname = sessionService.get("firstname");
      SharedDataBeaconsController.firstname = $scope.firstname;
    }
    if(sessionService.get("name")) {
      $scope.name = sessionService.get("name");
      SharedDataBeaconsController.name = $scope.name;
    }
    if(sessionService.get("room")) {
      $scope.room = sessionService.get("room");
      SharedDataBeaconsController.room = $scope.room;
    }
    if(sessionService.get("age")) {
      $scope.age = sessionService.get("age");
      SharedDataBeaconsController.age = $scope.age;
    }
  }

  //Search for the neighbor beacons
  $scope.initBeaconsPlugin = function() {
    $scope.beacons = {};

    $ionicPlatform.ready(function() {
      $cordovaBeacon.requestWhenInUseAuthorization();
      $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
        var uniqueBeaconKey;
        for(var i = 0; i < pluginResult.beacons.length; i++) {
          uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
          $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];

          //Store detected beacons
          SharedDataCtrl.beacons = $scope.beacons;
        }
        $scope.$apply();
      });
      $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("iBeacon", "85FC11DD-4CCA-4B27-AFB3-876854BB5C3B"));
    });
  };

  //Get nearest beacon to the patient (the beacon in his room)
  $scope.getNearestBeacon = function() {
    $scope.mapBeacons = {};
    for (var p in SharedDataCtrl.beacons) {
      $scope.mapBeacons[SharedDataCtrl.beacons[p]["accuracy"]] = p;
    }

    var minOfAccuracy = Math.min.apply(null, Object.keys($scope.mapBeacons));
    var idMinOfAccuracy = $scope.mapBeacons[minOfAccuracy];

    SharedDataBeaconsController.uuid = SharedDataCtrl.beacons[idMinOfAccuracy].uuid;
    SharedDataBeaconsController.major = SharedDataCtrl.beacons[idMinOfAccuracy].major;
    SharedDataBeaconsController.minor = SharedDataCtrl.beacons[idMinOfAccuracy].minor;
    SharedDataBeaconsController.proximity = SharedDataCtrl.beacons[idMinOfAccuracy].proximity;
    SharedDataBeaconsController.rssi = SharedDataCtrl.beacons[idMinOfAccuracy].rssi;
    SharedDataBeaconsController.tx = SharedDataCtrl.beacons[idMinOfAccuracy].tx;
    SharedDataBeaconsController.accuracy = SharedDataCtrl.beacons[idMinOfAccuracy].accuracy;
  };

  //Get notification when staff send data
  socket.on('notification2', function(data) {
    //alert(data);
    $scope.incomingData = data;
    $scope.pushLocalNotification();
  });

  //Get local notification from staff
  $scope.pushLocalNotification = function() {
    $cordovaLocalNotification.isScheduled("123").then(function(isScheduled) {
    });
    var alertTime = new Date();
    alertTime.setSeconds(alertTime.getSeconds() + 10);
    $cordovaLocalNotification.add({
      id: "123",
      date: alertTime,
      message: "Hello, " +$scope.incomingData+" is coming to help you.",
      title: "Your alert!",
      autoCancel: true
    }).then(function(){
      //console.log("The notificationw was set");
    });
  };

  //Add alert
  $scope.addBeacon = function(message, codeMessage) {
    SharedDataBeaconsController.message = message;
    SharedDataBeaconsController.codeMessage = codeMessage;

    //We test if patient have already scan his id Bar-Code
    if ($scope.idPatient != undefined || $scope.idPatient != null) {
      $scope.finalBeacon = {
        "idPatient": SharedDataBeaconsController.idPatient,
        "firstname": SharedDataBeaconsController.firstname,
        "name": SharedDataBeaconsController.name,
        "age": SharedDataBeaconsController.age,
        "room": SharedDataBeaconsController.room,
        "message": SharedDataBeaconsController.message,
        "codeMessage": SharedDataBeaconsController.codeMessage,
        "create_date": Date.now
      };

      //We add alert in database
      $http.post($scope.ipAddress+':4000/api/alerts/', $scope.finalBeacon)
      .success(function(response){
      })
      .error(function (data, status){
        alert("ERROR when adding alert in database");
      });

      //We show alert notification
      alert("Thank you for your alert.\nWe will send you someone as soon as possible!");
      //We push notification on the top bar
      //$scope.pushLocalNotification();

      //If beacon has successfully POST we emit message via socket.io
      socket.emit('new-alert-from-patient', $scope.finalBeacon);

    }else {
      alert("You need to scan your Bar-Code in the Scan Tab before sending your alert.");
    }
  };

  $scope.clearLocalStorage = function() {
    sessionService.clear();
    $window.location.reload();
  };

  //We update Nearest Beacons
  $interval($scope.getNearestBeacon, 10000);
})

.controller('ScanCtrl', function($rootScope, $scope, $cordovaBarcodeScanner, $window, $timeout, $http, $location, $ionicPlatform, 
                                $cordovaBeacon, SharedDataCtrl, SharedDataBeaconsController, servicesConfig, socket, sessionService) {

  //Get ip address from servicesConfig
  $scope.ipAddress = servicesConfig.urlAPI;
  
  //Scan the Bar-Code of the patient
  $scope.scanBarcode = function() {
    $cordovaBarcodeScanner.scan().then(function(imageData) {
      $scope.retrieveQrCodeData(imageData);
    }, function(error) {
      //console.log("An error happened -> " + error);
    });
  };

  //Retrieve the infos related to the founded QR-Code (id, first name, name, age, room)
  $scope.retrieveQrCodeData = function(qrObj) {
    //Fake QR-Code for Patient
    $scope.patients = [
      { 
        "idPatient": "1111",
        "firstname": "Andrew",
        "name": "Mathey",
        "age": 21,
        "room": "302"
      },
      {
        "idPatient": "1222",
        "firstname": "Thomas",
        "name": "Bertley",
        "age": 33,
        "room": "99"
      },
      {
        "idPatient": "1333",
        "firstname": "Eveline",
        "name": "Cumaz",
        "age": 53,
        "room": "112"
      }
    ];

    var foundedQrCode = qrObj.text;
    
    //We search in our database for the QR-Code
    for (var i = 0; i < $scope.patients.length; i++) {
      var object = $scope.patients[i];
 
      if(object.idPatient === foundedQrCode) {
        SharedDataBeaconsController.idPatient = object.idPatient;
        SharedDataBeaconsController.firstname = object.firstname;
        SharedDataBeaconsController.name = object.name;
        SharedDataBeaconsController.age = object.age;
        SharedDataBeaconsController.room = object.room;
        
        sessionService.set("idPatient", object.idPatient);
        sessionService.set("firstname", object.firstname);
        sessionService.set("name", object.name);
        sessionService.set("age", object.age);
        sessionService.set("room", object.room);
        
        $scope.addPatientWithBeacon();
      }
    }
  };

  //Add patient beacon to databse
  $scope.addPatientWithBeacon = function() {

    $scope.finalBeacon = {
      "idPatient": SharedDataBeaconsController.idPatient,
      "uuid": SharedDataBeaconsController.uuid,
      "major": SharedDataBeaconsController.major,
      "minor": SharedDataBeaconsController.minor,
      "proximity": SharedDataBeaconsController.proximity,
      "rssi": SharedDataBeaconsController.rssi,
      "tx": SharedDataBeaconsController.tx,
      "accuracy": SharedDataBeaconsController.accuracy,
      "firstname": SharedDataBeaconsController.firstname,
      "name": SharedDataBeaconsController.name,
      "age": SharedDataBeaconsController.age,
      "room": SharedDataBeaconsController.room,
      "message": SharedDataBeaconsController.message,
      "codeMessage": SharedDataBeaconsController.codeMessage,
      "create_date": Date.now
    };

    $http.post($scope.ipAddress+':4000/api/beacons/', $scope.finalBeacon)
    .success(function(response){
      //Reload app
      $window.location.reload();
    })
    .error(function (data, status){
      alert("ERROR when sending message, sorry for this inconvenient, please try again or call the Staff");
    });
  };
})


