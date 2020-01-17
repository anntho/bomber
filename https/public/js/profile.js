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

    $('#block').on('click', function() {
        let username = $('#username span').text();
        swal({
            text: `Are you sure that you want to block ${username}?`,
            icon: 'warning',
            buttons: true
        })
        .then((proceed) => {
            if (proceed) {
                socket.emit('block', {
                    userId: $('#username').attr('data-id')
                });
            }
        });
    });

    $('#unblock').on('click', function() {
        let username = $('#username span').text();
        swal({
            text: `Are you sure that you want to unblock ${username}?`,
            icon: 'warning',
            buttons: true
        })
        .then((proceed) => {
            if (proceed) {
                socket.emit('unblock', {
                    userId: $('#username').attr('data-id')
                });
            }
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

    socket.on('block', function() {
        $('#block').text('unblock');
        $('#block').attr('id', 'unblock');
        feedback('success', 'Success!', null);
    });

    socket.on('unblock', function() {
        $('#unblock').text('block');
        $('#unblock').attr('id', 'block');
        feedback('success', 'Success!', null);
    });

    function feedback(icon, title, text) {
		swal({
			icon: icon,
            title: title,
            text: text
		});
	}
});