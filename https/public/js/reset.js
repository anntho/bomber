$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    $('#email').on('keypress', function(e) {
        if (e.which == 13) {
            getLink();
        }
    });

    $('#link').click(function() {
        getLink();
    });

    function getLink() {
        socket.emit('reset:step1', {
            email: $('#email').val()
        });
    }

    $('#reset').click(function() {
        let pass1 = $('#password1').val();
        let pass2 = $('#password2').val();

        if (code && pass1 && pass2) {
            socket.emit('reset:step2', {
                code: code,
                pass1: pass1,
                pass2: pass2
            });
        }
    });

    socket.on('success:step1', function() {
        $('#email').val('');
        report('success', 'Success', 'Please check your email for the link');
    });

    socket.on('success:step2', function() {
        return swal({
            icon: 'success',
            title: 'Success!',
            text: 'You will now be redirected to the login page.',
            closeOnClickOutside: false
        }).then(function() {
            location.href = '/login';
        });
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