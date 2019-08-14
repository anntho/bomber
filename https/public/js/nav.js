$(document).ready(async function() {
	var socket = io.connect(socketString);
	console.log('nav socket connected');

	let users = [];
	socket.emit('getUsers');
	socket.on('getUsers', function(data) {
		users = data.map(x => x.username);
	});

	$('#navSearch').on('keyup', function(evt) {
		if (evt.keyCode == 13) {
			if (!$('#navSearch').val()) {
				swal({
					icon: 'warning',
					text: 'Please enter a user'
				});
			} else {
				if (!users.includes($('#navSearch').val())) {
					swal({
						icon: 'warning',
						text: 'User not found'
					});
					$('#navSearch').val('');
				} else {
					window.location.href = '/@/' + $('#navSearch').val();
				}
			}
		}
	});
});