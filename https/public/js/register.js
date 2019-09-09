$(document).ready(async function() {
    var socket = io.connect(socketString);

    socket.on('success', async function(data) {
        await report('success', 'success', 'you can now login!');
        window.location.href = '/login';
    });

    socket.on('err', function(data) {
        report('error', 'error.', data);
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
        register();
    });

    $('input[data-register=true').on('keypress', function(evt) {
        if (evt.which === 13) {
            register();
        }
    });

    async function register() {
        if (!$('#uname').val()) {
            report('info', 'Whoops!', 'Please include a username');
        } else if (!$('#email').val()) {
            report('info', 'Whoops!', 'Please include an email address');
        } else if (!$('#password').val()) {
            report('info', 'Whoops!', 'Please include a password');
        } else if (!$('#password2').val()) {
            report('info', 'Whoops!', 'Please verify your password');
        } else if ($('#password').val() !== $('#password2').val()) {
            report('info', 'Whoops!', 'Passwords do not match');
        } else {
            var data = {
                uname: $('#uname').val(),
                email: $('#email').val(),
                password: $('#password').val(),
                password2: $('#password2').val()
            }
            socket.emit('register', data);
        }
    }
});