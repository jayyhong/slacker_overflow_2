
(function() {
  'use strict';
  angular
    .module('slackOverflowApp')
    .config(['authProvider', function(authProvider) {
      authProvider.init({
        domain: 'michaelhappycheng.auth0.com',
        clientID: 'UYaVFoBomqw7X7hyesh2Tyn52PKW9Zi4'
      });
    }])
    


})();