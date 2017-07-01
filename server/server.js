const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const router = require('./routes');
const db = require('./db');
const init = require('./init');

const port = 3456;

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
app.use('/', router);

app.use(express.static(path.join(__dirname, '../')));

const users = {};
io.on('connection', function(socket) {
  console.log('CHAT SERVER CONNECTION SUCCESSFUL');

  socket.on('updateEditor', function(edit){
    console.log("in updateEditor", edit)  
    socket.broadcast.emit('updateEditor', edit);
  });

  socket.on('join', function(email, callback) {
    console.log('USER JOINED, email: ', email);
    socket.email = email;
    users[socket.email] = socket;
    console.log('socket.email: ', socket.email);
    console.log('CURRENT USER LIST, users: ', users);
    updateUsers();
  });

  socket.on('exitChatServer', function(email, callback) {
    console.log('THIS IS EXIT, EMAIL : ', email);
    delete users[email];
    console.log('DELETE USERS', Object.keys(users));
    updateUsers();
  });

  socket.on('newMessage', function(messageBody, callback) {
    var sendTo = messageBody.email;
    var message = messageBody.message;
    messageBody.from = socket.email
    console.log('SEND TO: ', sendTo, ' MESSAGE: ', message, ' FROM: ', socket.email);
    console.log('MESSAGE BODY', messageBody);
    io.emit(sendTo, messageBody);
    io.emit(messageBody.from, messageBody);
    // socket.emit(sendTo, message);
  });

  function updateUsers() {
    console.log('UPDATING USER LIST: ', Object.keys(users));
    io.sockets.emit('users', Object.keys(users));
  }

  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);
    
    var numClients = io.engine.clientsCount;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');
    if (numClients > 0 && numClients < 11) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients <= 20) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

});

init()
  .then(() => {
    server.listen(process.env.PORT || port, () => console.log(`app is listening on port ${port}`));
  })
  .catch(err => console.error('unable to connect to database ', err));
