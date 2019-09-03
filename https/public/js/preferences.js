$(document).ready(async function() {
	let socket = io.connect(socketString);
	console.log('connected');

	socket.on('err', function(data) {
		console.log(data);
		console.log('err');
		report('error', 'Error', data);
	});

	function sweetalert(icon, title, text, content, buttons, button) {
		return swal({
			icon: icon,
			title: title,
			text: text,
			content: content,
			buttons: buttons,
			closeOnClickOutside: false
		});
	}

	socket.on('editUsername', function(data) {
		swal.stopLoading();
		swal.close();
		$('#navUsername').text(data.username);
		document.title = 'moviebomber.org | ' + data.username;
		sweetalert('success', 'success', null, null, [false, true]);
	});

	$('#editUsername').click(function() {
		sweetalert(
			null,
			'enter a new username',
			'you can only do this once',
			'input',
			['Cancel', 'Submit']
		).then(name => {
			if (!name) {
				swal.stopLoading();
				swal.close();
			} else {
				var invalid = /[^0-9a-z_]/gi;
				if (name.match(invalid)) {
					sweetalert('error', 'error', 'invalid name format', null, [false, true]);
				} else if (name.length < 5 || name.length > 15 ) {
					sweetalert('error', 'username must be between 5 and 15 characters long', null, [false, true]);
				} else {
					console.log(name);
					socket.emit('editUsername', {
						id: uid,
						username: name
					});
				}
			}
		});
	});

	$('#editEmail').click(function() {
		sweetalert(
			null,
			'Enter a new email address',
			'Please ensure that you have access to this account',
			'input',
			['Cancel', 'Submit']
		).then(email => {
			if (!email) {
				swal.stopLoading();
    			swal.close();
			} else {
				var regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/;
				if (!email.toUpperCase().match(regex)) {
					sweetalert('error', 'Invalid email format', null, [false, true]);
				} else {
					socket.emit('editEmail', {
						id: uid,
						email: email
					});
				}
			}
		});
	});

	$('#savePassword').click(function() {
		if (!$('#currentPassword').val() ||
			!$('#newPassword').val() ||
			!$('#confirmNewPassword')) {
			report('warning', 'Missing Fields', 'Please enter all password fields');
		} else {
			let email = $('#editEmail').val();
			email = email.trim();
			socket.emit('updateUser', {
				id: uid,
				type: 'password',
				passwords: [
					$('#currentPassword').val(),
					$('#newPassword').val(),
					$('#confirmNewPassword').val()
				]
			});
		}
	});

	$('#closeAccount').click(function() {
		swal({
			title: "Are you sure?",
			text: "Once deleted, you will not be able to recover your account!",
			icon: "warning",
			buttons: true
		})
		.then((willDelete) => {
			if (willDelete) {
				socket.emit('updateUser', {
					id: uid,
					type: 'close'
				});
		  	} else {
				swal("Your account is safe!");
		  	}
		});
	})
});