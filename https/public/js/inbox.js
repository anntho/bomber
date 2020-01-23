$(document).ready(async function() {
    let socket = io.connect(socketString);

    $('.delete').on('click', function() {
        let sid = $(this).attr('id');
        socket.emit('deleteConversation', {
            sid: sid
        });
    });

    socket.on('deleteConversation', function(data) {
        let selector = `#${data.sid}`;
        $(selector).remove();
        feedback('success', 'Success');
    });

    function feedback(icon, title) {
		swal({
			icon: icon,
			title: title
		});
	}
});