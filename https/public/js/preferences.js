$(document).ready(async function() {
	let socket = io.connect(socketString);

	socket.on('err', function(data) {
		sweetalert('error', 'Whoops!', data, null, [false, true]);
	});

	socket.on('editUsername', function(data) {
		sweetalertReload();
	});

	socket.on('editEmail', function() {
		sweetalertReload();
	});

	function sweetalert(icon, title, text, content, buttons) {
		return swal({
			icon: icon,
			title: title,
			text: text,
			content: content,
			buttons: buttons,
			closeOnClickOutside: false
		});
	}

	function sweetalertReload() {
		return swal({
			icon: 'success',
			title: 'Success',
			button: true,
			closeOnClickOutside: false
		}).then(function() {
			location.reload(true);
		});
	}

	$('#editUsername').click(function() {
		sweetalert(
			null,
			'Edit Username',
			'Please enter a new username (you can only do this once)',
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
			'Edit Email Address',
			'Please enter a new email address and ensure that you have access to that account.',
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

	$('#editPassword').click(function() {
		swal({
			title: 'Change Password',
			text: 'Please enter your current password',
			content: {
				element: 'input',
				attributes: {
					placeholder: 'Type your password',
					type: 'password',
				}
			}
		}).then(function(password) {
			if (password) {
				checkPassword(password).then(function() {
					var el = document.createElement('form');
					el.id = 'newPasswordForm';
					var childOne = document.createElement('input');
					childOne.type = 'text';
					childOne.placeholder = 'New Password';
					var childTwo = document.createElement('input');
					childTwo.type = 'text';
					childTwo.placeholder = 'Confirm New Password';

					el.appendChild(childOne);
					el.appendChild(childTwo);

					$('#newPasswordForm').submit(function(evt) {
						console.log('submitting')
						evt.preventDefault();
				
						console.log('form submitted')
					}) 

					swal({
						title: 'form',
						content: el
					}).then(function() {
						$('#newPasswordForm').submit();
					});



				}).catch(function(err) {
					console.log('no match')
				});
			}
		})
	});

	function checkPassword(password) {
		return new Promise(function(res, rej) {
			console.log('emitting')
			socket.emit('checkPassword', {
				id: uid,
				password: password
			});
			socket.on('checkPassword', function(data) {
				console.log('receiving')
				if (data) {
					res();
				} else {
					rej();
				}
			});
		});
	}

	// $('#closeAccount').click(function() {
	// 	swal({
	// 		title: "Are you sure?",
	// 		text: "Once deleted, you will not be able to recover your account!",
	// 		icon: "warning",
	// 		buttons: true
	// 	})
	// 	.then((willDelete) => {
	// 		if (willDelete) {
	// 			socket.emit('updateUser', {
	// 				id: uid,
	// 				type: 'close'
	// 			});
	// 	  	} else {
	// 			swal("Your account is safe!");
	// 	  	}
	// 	});
	// })
});