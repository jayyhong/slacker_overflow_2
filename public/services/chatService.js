(function() {
  'use strict';
  angular
    .module('slackOverflowApp')
    .service('chatService', ['$rootScope', function($rootScope) {
      const vm = this;
      vm.socket = window.io('https://morning-lowlands-81835.herokuapp.com');
      vm.users = [];
      vm.email;
      vm.messages = {};
      


      vm.joinChatServer = (email) => {
        vm.email = email;
        vm.socket.emit("join", email);
        vm.messages[vm.email] = [];
        
        vm.socket.on('users', function(data) {
          console.log('updating users', vm.users);
          vm.users = data;
          console.log('updated users', vm.users);
          $rootScope.$emit('updateUsers', vm.users);
        });

        vm.socket.on(vm.email, function(messageBody) {
          console.log('(chatService) Received Message to: ', messageBody.email, ' The Message: ', messageBody.message, ' From: ', messageBody.from);
          console.log('(chatService) Is $rootScope.$emit working?');
          vm.messages[vm.email].push(messageBody);
          console.log('VM MESSAGEEEEEEEEE IN CHAT SERVICE', vm.messages);
          $rootScope.$emit(vm.email, messageBody);
        });
      };

      vm.exitChatServer = (email) => {
        vm.socket.emit('exitChatServer', email);
      };

      vm.sendMessage = (messageBody) => {
        console.log('(chatService) Sending Message, messageBody: ', messageBody);
        console.log('(chatService) SEND TO: ', vm.email, ' THE MESSAGE IS ', vm.message);
        vm.socket.emit('newMessage', messageBody);
      }

      // vm.updateUsers = () => {
      //   vm.socket.on('users', function(data) {
      //     if (vm.users.length === 0) {
      //       vm.users.push(data[0]);
      //     }
      //     for (var i = 0; i < data.length; i++) {
      //       for (var j = 0; j < vm.users.length; j++) {
      //         if (data[i] !== vm.users[j]) {
      //           vm.users.push(data[i]);
      //         }
      //       }
      //     }
      //   });
      // };

////////////////////////////////////////////////////////////////////////////////////

 let ws = new WebSocket("wss://socket.blockcypher.com/v1/btc/test3");

  ws.onopen = function(event) {
    ws.send(JSON.stringify({event: "tx-confirmation", address: "n33UrA2MzaxvBUYjnXME7N2YC5toKPLsYu"}));
  }

  ws.onmessage = function (event) {
    console.log('this si the events.data', event.data);
    let tx = JSON.parse(event.data);
    console.log('this is the tx', tx);
    let getOuts = tx.outputs;
    let addrs = 'n33UrA2MzaxvBUYjnXME7N2YC5toKPLsYu';
    for (let i = 0; i < getOuts.length; i++) {
      let outAdd = tx.outputs[i];
        if(outAdd.addresses[0] === addrs) {
        let amount = outAdd.value;
        // console.log('this is the amoutn', amount);
        let total = amount / 100000000;
        document.getElementById('websocket').innerHTML = "<pre>" + '<h3>' + 'Latest Donation Received: ' +  + total + ' BTC' + '\n\n' + 'Transaction Hash: ' + tx.hash + '</h3>' + "<pre>";
      }
    }
}

    }])
})(window, window.angular);