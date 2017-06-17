angular.module('starter.services', [])

.factory('SharedDataCtrl', function() {
  // Might use a resource here that returns a JSON array
  //return: all detected beacons, nearest beacon

  return {
    beacons: {},
    nearestBeacon: ''
  };
})

.factory('SharedDataBeaconsController', function() {
  // Might use a resource here that returns a JSON array
  //Patient beacon
  
  return { 
    idPatient: '',
    uuid: '',
    major: '',
    minor: '',
    proximity: '',
    rssi: '',
    tx: '',
    accuracy: '',
    firstname: '',
    name: '',
    age: '',
    room: '',
    message: '',
    codeMessage: ''
  };
})

.factory('socket', ['$rootScope', 'servicesConfig', function($rootScope, servicesConfig) {
  //socket factory
  var ipAddress = servicesConfig.urlAPI;
  var socket = io.connect(ipAddress+':4000');

  return {
    on: function(eventName, callback){
      socket.on(eventName, callback);
    },
    emit: function(eventName, data) {
      socket.emit(eventName, data);
    }
  };
}])

.factory('sessionService', ['$window', '$http', '$localStorage', function($window, $http, $localStorage) {
  //Local Storage factory
  return {
    set:function(key, value){
      return localStorage.setItem(key,JSON.stringify(value));
    },
    get:function(key){
      return JSON.parse(localStorage.getItem(key));
    },
    destroy:function(key){
      return localStorage.removeItem(key);
    },
    clear:function(){
      return localStorage.clear();
    },
  };
}]);
