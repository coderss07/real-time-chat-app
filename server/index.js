const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

const users = {};

io.on('connection', socket => {
    socket.on('new-user', name => {
        // console.log(_name)
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name)
    })

    socket.on('send-msg', message => {
        socket.broadcast.emit('receive', {message: message, name: users[socket.id]});
    })

    socket.on('send-info', message => {
        socket.broadcast.emit('receiveinfo', {name: users[socket.id], message: message});
    })

    socket.on('disconnect', message => {
        socket.broadcast.emit('left', users[socket.id]);
        delete users[socket.id];
    })

    socket.on('file-share', data => {
        socket.broadcast.emit('receiveFile', {name: users[socket.id], metadata: data.metadata, buffer: data.buffer});
    })

    socket.on('give-list', () => {
        socket.emit("listening", {id: socket.id, users: users});
    })

    socket.on('toMention', data => {
        socket.in(data.receiverId).emit('mention-user', {name: users[socket.id], message: data.message});
    })

})