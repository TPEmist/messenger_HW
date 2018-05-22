var db = require('../db/mysql');
var sio = require('socket.io');
var IO = function(server) {
	var io = sio.listen(server)
	var users = {},
		usocket = {};
	var counter = 0;
	var home = {};
	var xss = require('xss');
	var quest = "";
	var interval = null;
	
	xss.whiteList['img'] = ['src'];

	delete xss.whiteList['div'];

	xss.onIgnoreTag = function(tag, html) {
		return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}


	io.on('connection', function(socket) {
		console.log('a user connected.');
		var username = "";
		socket.broadcast.emit('hi', {})
		socket.on('disconnect', function() {
			console.log('user disconnected.');
		});
		socket.on('chat message', function(data) {
			var msg = data.msg
			data.user = xss(username || data.user);
			users[username] = data.user;
			data.msg = xss(msg);
			data.time = +new Date();
			console.log(data)
			if (!data.to) {
				console.log('public')
				sendmsg(data);
			} else {
				data.type = 2; 
				console.log("one")
				sendUserMsg(data);
			}
			insertData(data);
			
		});
		socket.on('user join', function(data) {
			counter++;
			username = xss(data.user);
			users[username] = username;
			usocket[username] = socket;
			console.log('join:' + data.user);
			data.type = 0;
			data.users = users;
			data.counter = counter;
			data.msg = "user <b>" + data.user + "</b> joins the room."+" <br /><l>You can now send this user a private message by clicking the name on the right.</l>";
			sendmsg(data);
		});
		socket.on('disconnect', function() {
			console.log('disconnect')
			if (username) {
				counter--;
				delete users[username];
				delete usocket[username];
				if (home.name == username) {
					homeLeave(username);
				}
				sendmsg({
					type: 0,
					msg: "user <b>" + username + "</b> has left.",
					counter: counter,
					users: users
				})
			}
		});
		
	});


	function insertData(data) {
		var conn = db.connect();
		var post = {
			msg: data.msg,
			uname: data.user,
			time: data.time.toString(),
			to: data.to
		};
		var query = conn.query('insert into chatmsg set ?', post, function(err, result) {
			console.log(err);
			console.log(result)
		})
		console.log(query.sql);
		conn.end();
	}

	function sendmsg(data) {
		io.emit('chat message', data);
	}

	function sendUserMsg(data) {
		if (data.to in usocket) {
			console.log('================')
			console.log('to' + data.to, data);
			usocket[data.to].emit('to' + data.to, data);
			usocket[data.user].emit('to' + data.user, data);
			console.log('================')
		}
	}
	/*
	io.emit('some event', {
		for: "everyone"
	});
	*/
}
module.exports = IO;