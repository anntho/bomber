$(document).ready(async function() {
    var socket = io.connect(socketString);

    // Sockets
    socket.emit('live');
    socket.on('error', function(data) {
        report('error', 'error', data);
    });
    socket.on('info', function(data) {
        report('info', 'info', data);
    });
    socket.on('matched', function(data) {
        report('success', 'found match', data);
    });
    socket.on('joined', function(data) {
        report('success', 'joined match', data);
    });
    socket.on('re-joined', function(data) {
        report('success', 're-joined match', data);
    });


    // Listeners
    $('#search').click(function() {
        socket.emit('find');
    });



    

    // Helpers
    function report(icon, title, text) {
        return swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
    }

});