$(document).ready(async function() {
    var socket = io.connect(socketString);

    socket.on('success', async function(data) {
        await report('success', 'success', 'you can now login!');
        window.location.href = '/login';
    });

    socket.on('err', function(data) {
        report('error', 'error', data);
    });

    async function report(icon, title, text) {
        return await swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
    }

    $('#submit').click(async function() {
        if (!$('#uname').val()) {
            report('info', 'whoops', 'please include a username');
        } else if (!$('#email').val()) {
            report('info', 'whoops', 'please include an email address');
        } else if (!$('#password').val()) {
            report('info', 'whoops', 'please include a password');
        } else if (!$('#password2').val()) {
            report('info', 'whoops', 'please verify your password');
        } else if ($('#password').val() !== $('#password2').val()) {
            report('info', 'whoops', 'passwords do not match');
        } else {
            var data = {
                uname: $('#uname').val(),
                email: $('#email').val(),
                password: $('#password').val(),
                password2: $('#password2').val()
            }
            socket.emit('register', data);
        }
    });
});