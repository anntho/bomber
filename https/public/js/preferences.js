$(document).ready(async function() {
	let socket = io.connect(socketString);

	socket.on('err', function(data) {
		sweetalert('error', 'Whoops!', data.error, null, [false, true]);
		if (data.code === 1) {
			$('#username').addClass('invalid');
		} else if (data.code === 2) {
			console.log('email error')
		}
	});

	socket.on('editUsername', function(data) {
		sweetalertReload();
	});

	socket.on('editEmail', function() {
		sweetalertLogout();
	});

	socket.on('editPassword', function() {
		sweetalertLogout();
	});

	socket.on('deleteAccount', function() {
		sweetalertLogout();
	});

	let sweetalert = async (icon, title, text, content, buttons) => {
		return await swal({
			icon: icon,
			title: title,
			text: text,
			content: content,
			buttons: buttons,
			closeOnClickOutside: false
		});
	}

	let sweetalertLogout = async () => {
		await swal({
			icon: 'success',
			title: 'Success',
			button: true,
			closeOnClickOutside: false
		});
		return location.href = '/logout';
	}

	let sweetalertReload = async () => {
		await swal({
			icon: 'success',
			title: 'Success',
			button: true,
			closeOnClickOutside: false
		});
		return location.reload(true);
	}

	$('.alert-icon').click(function() {
		$('.alert').hide();
	});

	// ==========================================================================
	// Username 
	// ==========================================================================
	$('#username').keypress(function(e) {
		if (e.which == 13) editUsername();
	});

	$('#editUsername').click(function() {editUsername()});

	let editUsername = () => {
		let invalid = /[^0-9a-z_]/gi;
		if ($('#username').val()) {
			let name = $('#username').val();
			if (name.match(invalid)) {
				sweetalert('error', 'Error', 'Invalid name format', null, [false, true]);
			} else if (name.length < 5 || name.length > 15 ) {
				sweetalert('error', 'Error', 'Usernames must be between 5 and 15 characters long', null, [false, true]);
			} else {
				console.log('sending username..')
				socket.emit('editUsername', {username: name});
			}
		}
	}
  
	// ==========================================================================
	// Email 
	// ==========================================================================
	$('#email').keypress(function(e) {
		if (e.which == 13) editEmail();
	});

	$('#editEmail').click(function() {editEmail()});

	let editEmail = () => {
		let regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/;
		if ($('#email').val()) {
			if (!$('#email').val().toUpperCase().match(regex)) {
				sweetalert('error', 'Invalid email format', null, [false, true]);
			} else {
				console.log('sending email..');
				socket.emit('editEmail', {email: $('#email').val()});
			}
		}
	};

	// ==========================================================================
	// Password
	// ==========================================================================
	$('#npassc').keypress(function(e) {
		if (e.which == 13) editPassword();
	});

	$('#editPassword').click(function() {editPassword()});
	
	let editPassword = () => {
		if ($('#cpass').val() && $('#npass').val() && $('#npassc').val()) {
			socket.emit('editPassword', {
				current: $('#cpass').val(),
				new: $('#npass').val(),
				confirm: $('#npassc').val()
			});
		}
	};

	// ==========================================================================
	// Delete Account 
	// ==========================================================================
	$('#deleteAccount').click(async function() {
		let proceed = await swal({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover your account!',
			icon: 'warning',
			buttons: true
		});

		if (proceed) {
			socket.emit('deleteAccount');
		} else {
			swal('Your account is safe!');
		}
	});
});