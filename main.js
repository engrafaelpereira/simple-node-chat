var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var messages = [];
var chatters = [];

app.use(express.static('public'));

io.on('connection', function(client) {
	console.log('Client connected ...');
	
	client.on('join', function(name) {
		console.log('join');
		client.nickname = name;

		if (chatters.indexOf(name) < 0) {
			chatters.push(name);

			chatters.forEach(function(chatterName){
				client.emit('newChatter', chatterName);
			});
			client.broadcast.emit('newChatter', name);

			messages.forEach(function(message) {
				client.emit('messages', message.name + ": " + message.data);
			});
		}
	});

	client.on('disconnect', function(data) {
		console.log('disconnect: ' + client.nickname);
		// remove chatter
		var i = chatters.indexOf(client.nickname);
		if (i > -1) {
			chatters.splice(i, 1);
		}
		client.broadcast.emit("removeChatter", client.nickname);
	});

	client.on('messages', function(data) {
		console.log('New message: ' + data + ', from: ' + client.nickname);

		// send to another clients
		client.broadcast.emit("messages", client.nickname + ': ' + data);
		// send to the client
		client.emit("messages", client.nickname + ': ' + data);

		storeMessage(client.nickname, data);
	});
});

var storeMessage = function(name, data) {
	messages.push({name: name, data: data});
	if (messages.length > 10) {
		messages.shift();
	}
};

server.listen(8080, function() {
	console.log('Server online');
});