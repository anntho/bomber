$(document).ready(async function() {
	let socket = io.connect(socketString);

	$('#send').click(function() {
		let message = $('#newMessage').val();
		$('#newMessage').val('');
		socket.emit('newMessage', {
			message: message
		});
	});
	
	socket.emit('getMessages', {
		sid: sid
	});

	socket.on('getMessages', function(data) {
		fillContainer(data);
	});

    function feedback(icon, title) {
		swal({
			icon: icon,
			title: title
		});
	}

	function fillContainer(messages) {
		let container = document.getElementById('container');
		for (const m of messages) {
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
			textLine.classList.add('text', 'z-depth-2');

			if (m.sender == userIdString)  {
				messageWrapper.classList.add('primary');
			} else {
				messageWrapper.classList.add('secondary');
			}

			usernameLine.textContent = m.username;
			textLine.textContent = m.message;
			dateLine.textContent = new Date(m.created).toString().split('G')[0];

			textWrapper.appendChild(textLine);
			bubble.appendChild(usernameLine);
			bubble.appendChild(textWrapper);
			bubble.appendChild(dateLine);
			bubbleWrapper.appendChild(bubble);
			messageWrapper.appendChild(bubbleWrapper);
			container.appendChild(messageWrapper);
		}
	}
});