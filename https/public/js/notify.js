$(document).ready(async function() {
    let socket = io.connect(socketString);
    
    socket.emit('updateSocket', 'notification');

    socket.on('notify:message', function() {
        showNotification();
    });

    socket.on('notify:challenge', function(data) {
        showNotification();
        //desktopNotification(data.roomId);
        showTab(data);
    });

    socket.on('notify:connected', function(data) {
        joinGame(data);
    });

    socket.on('notify:decline', function(data) {
        $('#searchModal').modal('close');
        return swal({
            icon: 'info',
            text: 'Your challenge was declined'
        });
    });

    socket.on('notify:cancel', function(data) {
        $('#notification').hide();
        $('li.challenge').hide();
        $('li.challenge a').attr('id', '');
    });

    $('li.challenge a').click(function() {
        let roomId = $('li.challenge a').attr('id');
        socket.emit('accept', {
            roomId: roomId
        });
    });

    function showTab(data) {
        $('li.challenge a').attr('id', data.roomId);
        $('li.challenge').show();
    }

    function showNotification() {
        $('#notification').show();
    }

    function joinGame(data) {
        $('#searchModal').modal('close');
        location.href = `/live/${data.room}`;
    }

    // function desktopNotification(roomId) {
    //     if (Notification) {
    //         if (Notification.permission !== 'granted') {
    //             Notification.requestPermission();
    //         } else {
    //             let notification = new Notification('Challenge Request', {
    //                 icon: '/icons/favicon.png',
    //                 body: "Hey there, you've got an incoming challenge request",
    //             });
                
    //             notification.onclick = function(data) {
    //                 socket.emit('accept', {
    //                     roomId: roomId
    //                 });
    //             };
    //         }
    //     }
    // }
});