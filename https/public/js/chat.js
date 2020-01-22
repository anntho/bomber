$(document).ready(async function() {
	let socket = io.connect(socketString);

	$('#send').click(function() {
		sendMessage();
	});

	$('input#message').keypress(function(e) {
		if (e.which == 13) {
			sendMessage();
			$('#message').val('');
		}
	});

	socket.on('message', function(data) {
		appendMessage(data[0]);
	});
	
	socket.emit('getMessages', {sid: sid});
	socket.on('getMessages', function(data) {
		setFriend(data);
		fillContainer(data);
	});

    function feedback(icon, title) {
		swal({
			icon: icon,
			title: title
		});
	}

	function sendMessage() {
		let message = $('#message').val();
		$('#message').val('');
		socket.emit('message', {
			message: message, 
			recipientId: $('#friend').attr('data-friendId')
		});
	}

	function setFriend(data) {
		let friendId = null;
		let friendUsername = null;
		let s = data.find(m => m.sender != userIdString);
		let r = data.find(m => m.recipient != userIdString);
		if (s) {
			friendId = s.sender;
			friendUsername = s.senderUsername;
		} else {
			friendId = r.recipient;
			friendUsername = r.recipientUsername;
		}
		$('#friend').text(friendUsername);
		$('#friend').attr('data-friendId', friendId);
	}

	function fillContainer(messages) {
		for (const message of messages) {
			appendMessage(message);
		}
	}

	function appendMessage(data) {
		let container = document.getElementById('container');
		let messageWrapper = document.createElement('div');
		let bubbleWrapper = document.createElement('div');
		let bubble = document.createElement('div');
		let usernameLine = document.createElement('span');
		let textWrapper = document.createElement('span');
		let textLine = document.createElement('span');
		let dateLine = document.createElement('span');

		messageWrapper.classList.add('message-wrapper');
		bubbleWrapper.classList.add('bubble-wrapper');
		bubble.classList.add('bubble');
		usernameLine.classList.add('label');
		dateLine.classList.add('label');
		textLine.classList.add('text');

		if (data.sender == userIdString) {
			messageWrapper.classList.add('primary');
		} else {
			messageWrapper.classList.add('secondary');
		}

		usernameLine.textContent = data.senderUsername;
		textLine.textContent = data.message;
		let date = new Date(data.messageCreated);
		let diff = timeDiff(date);
		dateLine.textContent = diff;

		textWrapper.appendChild(textLine);
		bubble.appendChild(usernameLine);
		bubble.appendChild(textWrapper);
		bubble.appendChild(dateLine);
		bubbleWrapper.appendChild(bubble);
		messageWrapper.appendChild(bubbleWrapper);
		container.appendChild(messageWrapper);
	} 

	function timeDiff(d) {
		let today = new Date();
		let sent = new Date(d);
		let ms = (today - sent); // milliseconds
		let text = '';
		let days = 0;
		let hours = (ms / (1000*60*60));
		let minutes = (ms / (1000*60));
		if (hours > 24) {
			days = Math.round(hours/24);
			text = `${days} days ago`;
		} else if (hours > 1) {
			hours = hours.toFixed(0);
			text = `${hours} hours ago`;
		} else if (minutes > 1) {
			minutes = minutes.toFixed(0);
			text = `${minutes} minutes ago`;
		} else {
			text = ` now`;
		}
		return text;
	}
});