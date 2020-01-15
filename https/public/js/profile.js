$(document).ready(async function() {
    let socket = io.connect(socketString);

    $('#games').on('click', 'tr', function() {
        let id = $(this).attr('id');
        location.href = `/live/${id}`;
    });

    $('#follow').on('click', function() {
        socket.emit('follow', {
            userId: $('#username').attr('data-id')
        });
    });

    $('#unfollow').on('click', function() {
        socket.emit('unfollow', {
            userId: $('#username').attr('data-id')
        });
    });

    $('#sendMessage').on('click', function() {
        socket.emit('message', {
            recipientId: $('#username').attr('data-id'),
            message: $('#messageTextarea').val()
        });
    });

    socket.on('follow', function() {
        $('#follow').text('unfollow');
        $('#follow').attr('id', 'unfollow');
        feedback('success', 'Success!', null);
    });

    socket.on('unfollow', function() {
        $('#unfollow').text('follow');
        $('#unfollow').attr('id', 'follow');
        feedback('success', 'Success!', null);
    });

    socket.on('message', function() {
        feedback('success', 'Success!', 'Message sent.');
    });

    function feedback(icon, title, text) {
		swal({
			icon: icon,
            title: title,
            text: text
		});
	}
});