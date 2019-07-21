$(document).ready(async function() {
	let socket = io.connect(socketString);
	console.log('connected');

	socket.on('err', function(data) {
		console.log(data);
		console.log('err');
		report('error', 'Error', data);
	});

	socket.on('success', function(data) {
		if (data && data.location) {
			window.location.href = data;
		} else if (data && data.username) {
			swal.stopLoading();
    		swal.close();
    		$('#navUsername').text(data.username);
    		document.title = 'moviebomber.org | ' + data.username;
    		report('success', 'success');
		} else {
			swal.stopLoading();
    		swal.close();
    		report('success', 'success', data);
		}
	});

	$('#editUsername').click(function() {
		swal({
			text: 'Enter a new username',
			content: 'input',
			buttons: true
		}).then(name => {
			if (!name) {
				swal.stopLoading();
    			swal.close();
			} else {
				var checkInvalid = /[^0-9a-z_]/gi;
				if (name.match(checkInvalid)) {
					return swal('Invalid username format');
				} else if (name.length < 5 || name.length > 15 ) {
					return swal('Username must be between 5 and 15 characters long');
				} else {
					socket.emit('updateUser', {
						id: uid,
						type: 'username',
						username: name
					});
				}
			}
		});
	});

	$('#editEmail').click(function() {
		swal({
			text: 'Enter a new email',
			content: 'input',
			button: {
				text: 'Save',
		    	closeModal: false,
		  	},
		}).then(email => {
			if (!email) {
				swal.stopLoading();
    			swal.close();
			} else {
				var regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/;
				if (email.toUpperCase().match(regex)) {
					socket.emit('updateUser', {
						id: uid,
						type: 'email',
						email: email
					});
				} else {
					return swal('Invalid format');
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

	function report(icon, title, text) {
		return swal({
			icon: icon,
			title: title,
			text: text,
			closeOnClickOutside: false
		});
	}
});