$(document).ready(async function() {
    let socket = io.connect(socketString);

    $('#games').on('click', 'tr', function() {
        let id = $(this).attr('id');
        location.href = `/live/${id}`;
    });
});