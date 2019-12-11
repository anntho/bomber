$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    $('#reset').click(function() {
        console.log('sending')
        socket.emit('resetPt1', {
            email: $('#email').val()
        });
    });

    socket.on('success', function() {
        $('#email').val('');
        report('success', 'Success', 'Please check your email for the link');
    });

    socket.on('failure', function() {
        $('#email').val('');
        report('error', 'Whoops!', 'Looks like we cannot process that request.');
    });

    socket.on('err', function() {
        report('error', 'Whoops!', 'Something went wrong. A report has been submitted and we are on it.');
    });

    function report(icon, title, text) {
        return swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
    }
});