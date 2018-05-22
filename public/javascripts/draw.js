var Draw = {
	init: function(socket, user) {
		
		var ishome = false;

		function send(content, type) {
			now = +new Date();
		
			socket.emit('draw', {
				data: content,
				type: type,
				user: user
			});
		};
		$('#home').click(function() {
			socket.emit('home', {
				user: user
			})
		});
		socket.on('draw', function(data) {

			ProcessingData(data);
		});
		socket.on('quest',function(quest){
			
			$('#messages').scrollTop(99999);
		})
		socket.on('sys' + user, function(data) {
			if (data.user == user) {
				ishome = true;
				$('#leave').show();
				$('#clear').show();
			} else {
				ishome = false;
				$('#clear').hide();
				$('#leave').hide();
			}
			
			$('#messages').scrollTop(99999);
		});
		$('#leave').click(function() {
		
			socket.emit("home leave", user);
			$('#leave').hide();
			ishome = false;
		});
		$('#clear').click(function(){
			if (ishome) {
				
				send("", "clear");
			}
		});
		socket.on('home leave', function(username) {
			
		});

		if (drawboard.getContext) {
			var ctx = drawboard.getContext("2d");
			var start = false;
			ctx.lineCap = "round";
			ctx.lineWidth = 2;
			ctx.strokeStyle = "blue";
			$(drawboard).bind("mousedown", function(e) {
				if (!ishome) return;
				start = true;
				var x = e.offsetX;
				var y = e.offsetY + 18;
				ctx.beginPath();
				ctx.moveTo(x, y);
			}).bind("mousemove", function(e) {
				if (start) {
					var x = e.offsetX;
					var y = e.offsetY + 18;
					ctx.lineTo(x, y);
					ctx.stroke();
				}
			}).bind("mouseup", function(e) {
				start = false;
				ctx.closePath();
				send(drawboard.toDataURL("image/gif"), "draw");
			}).bind('mouseout', function(e) {
				if (start) {
					start = false;
					ctx.closePath();
					send(drawboard.toDataURL("image/gif"), "draw");
				}
			});
		} else {
			$(drawboard).hide();
		}

		function ProcessingData(result) {
			if (result.type == "clear") {
				var ctx = drawboard.getContext("2d");
				ctx.clearRect(0, 0, $(drawboard).width(), $(drawboard).height());
				return true;
			}
			if (result.type == "draw" && drawboard.getContext) {
				var ctx = drawboard.getContext("2d");
				var img = document.createElement("img");
				img.src = result.data;
				img.onload = function() {
					ctx.clearRect(0, 0, $(drawboard).width(), $(drawboard).height());
					ctx.drawImage(img, 0, 0);
				}
			}
		}
	}
}