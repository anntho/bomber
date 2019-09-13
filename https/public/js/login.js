$(document).ready(async function() {
    var socket = io.connect(socketString);

    socket.on('err', function(data) {
        report('error', 'Whoops!', data.error);
    });

    socket.on('success', function() {
        window.location.href = '/account/preferences';
    });

    $('#submit').click(async function() {
        login();
    });

    $('.login').on('keypress', function(evt) {
        if (evt.which == 13) {
            login();
        }
    });

    function login() {
        if (!$('#username').val() || !$('#password').val()) {
            report('warning', 'Whoops!', 'Please enter a username and password');
        } else {
            socket.emit('login', {
                username: $('#username').val(),
                password: $('#password').val()
            });
        }
    }

    function report(icon, title, text) {
        return swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
    }
});