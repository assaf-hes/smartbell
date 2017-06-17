angular.module('starter.controllers', [])

.controller('ManageDataCtrl', function($rootScope, $scope, $window, $timeout, $interval, $localStorage, $sessionStorage, $http, $location, $ionicPlatform, 
                                      $cordovaBeacon, SharedDataCtrl, SharedDataBeaconsController, servicesConfig, socket, sessionService, $cordovaLocalNotification) {

  //Environnement variables (ip address and port)
  $scope.ipAddress = servicesConfig.urlAPI;

  //Alerts
  $scope.alerts = {};

  $scope.idStaff = "";
  $scope.staffRole = "";
  $scope.staffRoleCode = "";
  $scope.firstname = "";
  $scope.name = "";

  $scope.receivedCodeMessage = "";

  //Latest alert emitted by patient
  $scope.latestAlert = [];

  //Check if Take It button was clicked or not
  $scope.isTakeItBtnClicked;

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
    //Get Active Emergency Alerts (all alerts emitted by patients)
    $scope.getPatientsAlerts();
  };

  //Put timer to make some process when searching for beacons
  $scope.$on('$ionicView.loaded', function() {
    $scope.init();
    $scope.checkStaffAuth();
  });

  //Check if user has already scan his QR-Code and have his credentials in local storage
  $scope.getUserAuth = function() {

    if(sessionService.get("idStaff")) {
      $scope.idStaff = sessionService.get("idStaff");
      SharedDataBeaconsController.idStaff = $scope.idStaff;
      $scope.isStaffKnown = 1;
    }
    if(sessionService.get("staffRole")) {
      $scope.staffRole = sessionService.get("staffRole");
      SharedDataBeaconsController.staffRole = $scope.staffRole;
    }
    if(sessionService.get("staffRoleCode")) {
      $scope.staffRoleCode = sessionService.get("staffRoleCode");
      SharedDataBeaconsController.staffRoleCode = $scope.staffRoleCode;
    }
    if(sessionService.get("firstname")) {
      $scope.firstname = sessionService.get("firstname");
      SharedDataBeaconsController.firstname = $scope.firstname;
    }
    if(sessionService.get("name")) {
      $scope.name = sessionService.get("name");
      SharedDataBeaconsController.name = $scope.name;
    }
    if(sessionService.get("receivedCodeMessage")) {
      $scope.receivedCodeMessage = sessionService.get("receivedCodeMessage");
      SharedDataCtrl.receivedCodeMessage = $scope.receivedCodeMessage;
    }
    if(sessionService.get("latestAlert")) {
      $scope.latestAlert = sessionService.get("latestAlert");
      SharedDataCtrl.latestAlert = $scope.latestAlert;
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

  //Get notification when patient send Alert
  socket.on('notification', function(data) {
    $scope.getAllDataNotification(data);
  });

  //Get all received data from socket
  $scope.getAllDataNotification = function(data) {
    $scope.receivedCodeMessage = data;
    sessionService.set("receivedCodeMessage", data);
    $scope.getAlertById(data);
    $scope.getLocalNotification();
  };

  //Get the latest alert by id
  $scope.getAlertById = function(idPatient) {
    $http.get($scope.ipAddress+':4000/api/alerts/'+idPatient)
    .success(function(response){
      if (JSON.stringify($scope.staffRoleCode) === JSON.stringify($scope.receivedCodeMessage)) {
        $scope.latestAlert.push(response);
        sessionService.set("latestAlert", $scope.latestAlert);
      }
    })
    .error(function (data, status){
      alert("Please verify that server is running");
    });
  };

  //Get notification when alert coming from patient
  $scope.getLocalNotification = function() {
    if (JSON.stringify($scope.staffRoleCode) === JSON.stringify($scope.receivedCodeMessage)) {
      $cordovaLocalNotification.isScheduled("456").then(function(isScheduled) {
      });
      var alertTime = new Date();
      alertTime.setSeconds(alertTime.getSeconds() + 10);
      $cordovaLocalNotification.add({
        id: "456",
        date: alertTime,
        message: "Hello, you have new alert, please check it!.",
        title: "New alert!",
        autoCancel: true
      }).then(function(){
        //console.log("The notificationw was set");
      });     
    }
  };

  //Confirm that staff take alert in charge 
  $scope.takeAlert = function(index) {
    document.getElementById(index).disabled = true;
    socket.emit('staff-take-alert-coming-from-patient', $scope.staffRole +" "+ $scope.firstname +" "+ $scope.name);
  };

  //Delete local storage
  $scope.clearLocalStorage = function() {
    sessionService.clear();
    $window.location.reload();
  };

  //Delete all alerts
  $scope.clearAllAlerts = function() {
    var newLastAlert = $scope.latestAlert.splice(0);

    $scope.latestAlert.push.apply(newLastAlert);
    sessionService.set("latestAlert", $scope.latestAlert);
  };

  //Delete alert
  $scope.deleteAlert = function(alertToremove, index) {
    var itemToDelete = $scope.latestAlert[index];
    var newLastAlert = $scope.latestAlert.splice(index, 1);

    $scope.latestAlert.push.apply(newLastAlert);
    sessionService.set("latestAlert", $scope.latestAlert);
    //Remove the div from DOM
    alertToremove.splice(index, 1);
  };

  //Get all patients alerts
  $scope.getPatientsAlerts = function() {
    if ($scope.idStaff) {
      $http.get($scope.ipAddress+':4000/api/alerts')
      .success(function(response){
        $scope.activeEmergencyAlerts = response;
      })
      .error(function (data, status){
        alert("ERROR when getting patients alerts");
      });
    }
  };

  $scope.checkStaffAuth = function() {
    if (!$scope.idStaff) {
      alert("Please Scan your Bar-Code to use aplication!");
    }
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

  $scope.retrieveQrCodeData = function(qrObj) {
    //Fake QR-Code for Doctor, Nurse and Assistance
    $scope.staff = [
      { 
        "idStaff": "2111",
        "staffRole": "Doctor",
        "staffRoleCode": "0",
        "firstname": "Christophe",
        "name": "Blanchard"
      },
      {
        "idStaff": "2222",
        "staffRole": "Doctor",
        "staffRoleCode": "0",
        "firstname": "Thomas",
        "name": "Bertley"
      },
      {
        "idStaff": "2333",
        "staffRole": "Doctor",
        "staffRoleCode": "0",
        "firstname": "Eveline",
        "name": "Cumaz"
      },
      {
        "idStaff": "3111",
        "staffRole": "Nurse",
        "staffRoleCode": "1",
        "firstname": "Delphine",
        "name": "Shuma"
      },
      {
        "idStaff": "3222",
        "staffRole": "Nurse",
        "staffRoleCode": "1",
        "firstname": "Angella",
        "name": "Matez"
      },
      {
        "idStaff": "3333",
        "staffRole": "Nurse",
        "staffRoleCode": "1",
        "firstname": "Robert",
        "name": "Fouin"
      },
      {
        "idStaff": "4111",
        "staffRole": "Assistance",
        "staffRoleCode": "2",
        "firstname": "Paule",
        "name": "Ricarcini"
      },
      {
        "idStaff": "4222",
        "staffRole": "Assistance",
        "staffRoleCode": "2",
        "firstname": "Andres",
        "name": "Buquin"
      },
      {
        "idStaff": "4333",
        "staffRole": "Assistance",
        "staffRoleCode": "2",
        "firstname": "Natalie",
        "name": "Legrand"
      }
    ];
    
    var foundedQrCode = qrObj.text;

    for (var i = 0; i < $scope.staff.length; i++) {
      var object = $scope.staff[i];

      if (object.idStaff === foundedQrCode) {
        SharedDataBeaconsController.idStaff = object.idStaff;
        SharedDataBeaconsController.staffRole = object.staffRole;
        SharedDataBeaconsController.staffRoleCode = object.staffRoleCode;
        SharedDataBeaconsController.firstname = object.firstname;
        SharedDataBeaconsController.name = object.name;

        sessionService.set("idStaff", object.idStaff);
        sessionService.set("staffRole", object.staffRole);
        sessionService.set("staffRoleCode", object.staffRoleCode);
        sessionService.set("firstname", object.firstname);
        sessionService.set("name", object.name);

        //After scan successful we add staff beacon in database
        $scope.addStafftWithBeacon();
        //Delete all alerts for the old staff
        $scope.clearAllAlerts(); 
      }
    }
  };

  //Add staff beacon to databse
  $scope.addStafftWithBeacon = function() {

    $scope.finalBeacon = {
      "idStaff": SharedDataBeaconsController.idStaff,
      "staffRole": SharedDataBeaconsController.staffRole,
      "staffRoleCode": SharedDataBeaconsController.staffRoleCode,
      "uuid": SharedDataBeaconsController.uuid,
      "major": SharedDataBeaconsController.major,
      "minor": SharedDataBeaconsController.minor,
      "proximity": SharedDataBeaconsController.proximity,
      "rssi": SharedDataBeaconsController.rssi,
      "tx": SharedDataBeaconsController.tx,
      "accuracy": SharedDataBeaconsController.accuracy,
      "firstname": SharedDataBeaconsController.firstname,
      "name": SharedDataBeaconsController.name,
      "responseToAlert": SharedDataBeaconsController.responseToAlert,
      "create_date": Date.now
    };

    $http.post($scope.ipAddress+':4000/api/staffbeacons/', $scope.finalBeacon)
    .success(function(response){
      //Reload app
      $window.location.reload();
    })
    .error(function (data, status){
      alert("ERROR when sending message, sorry for this inconvenient, please try again or call the Staff");
    });
  };
})

