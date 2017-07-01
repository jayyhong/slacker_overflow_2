(function() {
  'use strict';
  angular
  .module('slackOverflowApp')

  .controller('chatPageController', ['store', '$scope', '$timeout', '$mdSidenav', 'chatService', '$rootScope', function (store, $scope, $timeout, $mdSidenav, chatService, $rootScope) {
    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');
    const vm = this;
    vm.users = chatService.users;
    vm.newMessage = undefined;
    vm.newMessageBody = undefined;
    vm.email = store.get('profile').email;
    vm.messages = chatService.messages[vm.email];
    
    vm.editor = null;
    vm.e = null;
    //user change get"e"
    $scope.aceChanged = function(e){
      vm.e = e;
      console.log(e);
    }
    $scope.userInput = function(){
      console.log(vm.e);
      const edit = JSON.stringify(vm.e[0]);
      chatService.codeToServer(edit);
    }
    $scope.aceLoaded = function(_editor){
      chatService.setEditor(_editor);
      vm.editor = _editor;
    }

    vm.videoChat = function() {
      window.open(location + '/webRTC')
    }

    vm.sendMessage = function() {
      console.log('THE MESSAGE: ', vm.newMessage, ' IS BEING SENT TO: ', vm.clickedUser);
      vm.newMessageBody = {email: vm.clickedUser, message: vm.newMessage}
      console.log('THIS IS MESSAGE BODY BEING SENT: ', vm.newMessageBody);
      chatService.sendMessage(vm.newMessageBody)
      vm.newMessage = '';
    };

    vm.clickedUser;
    vm.clickUser = function(user) {
      console.log('CLICKED USER: ', user);
      vm.clickedUser = user;
      console.log('VM.CLICKEDUSER: ', vm.clickedUser);
      $scope.toggleLeft();
    };

    $rootScope.$on(vm.email, function(event, messageBody) {
      console.log('(chatPage) Receiving Message, messageBody: ', messageBody);
      $scope.$apply(function() {
        console.log('(chatPage) updating vm.messages: ', vm.messages);
        vm.messages = chatService.messages[vm.email];
        console.log('(chatPage) updated vm.messages: ', vm.messages)
      })
    });
    $rootScope.$on('updateUsers', function(event, users) {
      console.log('(chatPage) Received userinformation: ', users);
      $scope.$apply(function() {
        vm.users = users;
      });
    })

    // $scope.$watch(function() {
    //   return vm.users;
    // }, function() {
    //   if (vm.users) {
    //     console.log('This is vm.users on WATCH', vm.users);
    //   }
    // });



    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      };
    }


///////////////////////////////////

'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

/////////////////////////////////////////////

var room = 'penis';
// Could prompt for room name:
// room = socket.id;

var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

const sendMessage = (message) => {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', (message) => {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message))
      .then(()=> {
        doAnswer();
      })
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var showVideo = true;
// var hangupButton = document.getElementById('hangupButton')
// hangupButton.onclick = hangup;

this.start = () => {
  console.log('yessssssssssssssssssss', pc)
  this.showVideo = false;
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});
}

this.stop= () =>{
  this.showVideo = true;
  localStream.getVideoTracks()[0].stop()
  remoteStream.getVideoTracks()[0].stop()
}

const gotStream = (stream) => {
  console.log('Adding local stream.');
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = window.localStream = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

var constraints = {
  video: {
    mandatory: {
      maxWidth: 800,
      maxHeight: 600
    }
  }
};

console.log('Getting user media with constraints', constraints);

// if (location.hostname !== 'localhost') {
//   requestTurn(
//     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
//   );
// }

const maybeStart =() => {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

const createPeerConnection = () => {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

const handleIceCandidate = (event) => {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}

const handleCreateOfferError=(event) => {
  console.log('createOffer() error: ', event);
}

const doCall = () => {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

const doAnswer = () => {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

const setLocalAndSendMessage = (sessionDescription) => {
  // Set Opus as the preferred codec in SDP if Opus is present.
  //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

const onCreateSessionDescriptionError = (error) => {
  trace('Failed to create session description: ' + error.toString());
}

const requestTurn = (turnURL) => {
  var turnExists = false;
  for (var i = 0; i < pcConfig.iceServers.length; i++) {
    console.log('ice servers ----------', JSON.stringify(pcConfig.iceServers))
    console.log('pcConfig +++++++', JSON.stringify(pcConfig))
    console.log('==============', pcConfig.iceServers[0])
    console.log('==============', pcConfig.iceServers[0].urls)
    console.log('=====substr', pcConfig.iceServers[0].urls.substr(0,5))
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

handleRemoteStreamAdded=(event)=> {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}

const handleRemoteStreamRemoved = (event) => {
  console.log('Remote stream removed. Event: ', event);
}

const hangup=() => {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

const handleRemoteHangup=() => {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

const stop=() => {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('m=audio') !== -1) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
          opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length - 1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}




  }])

})();


