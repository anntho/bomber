$(document).ready(async function() {
    let socket = io.connect(socketString);
    
    socket.emit('updateSocket', {
        type: 'notification'
    });

    socket.on('notify', function() {
        $('#notification').show();
    });
});