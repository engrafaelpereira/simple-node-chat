var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var messages = [];
var chatters = [];

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(client) {
	console.log('Client connected ...');
	
	client.on('join', function(name) {
		client.nickname = name;

		if (chatters.find(name) === undefined) {
			chatters.push(name);
			chatters.forEach(function(chatterName){
				client.emit('newChatter', chatterName);
			});
			client.broadcast.emit('newChatter', chatterName);

			messages.forEach(function(message) {
				client.emit('messages', message.name + ": " + message.data);
			});
		}
	});

	client.on('disconnect', function(name) {
		// remove chatter
		var i = chatters.indexOf(name);
		if (i > -1) {
			chatters.slice(i, 1);
		}
		client.broadcast.emit("removeChatter", name);
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

server.listen(8080);