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

    socket.on('unfollow', function() {
        $('#unfollow').text('follow');
        $('#unfollow').attr('id', 'follow');
    });
});