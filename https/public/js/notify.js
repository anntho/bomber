$(document).ready(async function() {
    let socket = io.connect(socketString);
    
    socket.emit('updateSocket', 'notification');

    socket.on('notify:message', function() {
        showNotification();
    });

    socket.on('notify:challenge', function(data) {
        showNotification();
        showTab(data);
    });

    function showTab(data) {
        let link = `/live/${data.roomId}`;
        $('li.challenge a').attr('href', link);
        $('li.challenge').show();
    }

    function showNotification() {
        $('#notification').show();
    }
});