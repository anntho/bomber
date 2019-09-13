$(document).ready(async function() {
	let socket = io.connect(socketString);

	socket.on('err', function(data) {
		sweetalert('error', 'Whoops!', data.error, null, [false, true]);
		if (data.code === 1) {
			$('#username').addClass('invalid');
		}
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

	// ==========================================================================
	// Username 
	// ==========================================================================
	$('#username').keypress(function(e) {
		if (e.which == 13) {
			editUsername();
		}
	});

	$('#editUsername').click(function() { editUsername() });

	function editUsername() {
		var invalid = /[^0-9a-z_]/gi;
		if ($('#username').val()) {
			var name = $('#username').val();
			if (name.match(invalid)) {
				sweetalert('error', 'Error', 'Invalid name format', null, [false, true]);
			} else if (name.length < 5 || name.length > 15 ) {
				sweetalert('error', 'Error', 'Usernames must be between 5 and 15 characters long', null, [false, true]);
			} else {
				console.log('sending username..')
				socket.emit('editUsername', {id: uid, username: name});
			}
		}
	}
  
	// ==========================================================================
	// Email 
	// ==========================================================================
	$('#email').keypress(function(e) {
		if (e.which == 13) {
			editEmail();
		}
	});

	$('#editEmail').click(function() { editEmail() });

	$('#editEmail').click(function() {
		var regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/;
		if ($('#email').val()) {
			if (!email.toUpperCase().match(regex)) {
				sweetalert('error', 'Invalid email format', null, [false, true]);
			} else {
				socket.emit('editEmail', {id: uid, email: email});
			}
		}
	});



	$('#editPassword').click(function() {

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