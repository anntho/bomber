$(document).ready(function() {
	console.log('loaded')
	let socket = io.connect(socketString);
    let room = null;

    let report = async (icon, title, text) => {
        return await swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
    }
    
    socket.on('err', (err) => {
        alert('error check console');
        report('error', 'Error', JSON.stringify(err));
    });

	socket.emit('update');
	socket.on('update', (data) => {
		room = data.room;
		console.log(room);
		console.log(socket.id);
    });
    
	socket.on('connected', function(data) {
		room = data.room;
		console.log(data);
		alert('connected');
	});

	socket.on('msg', function(data) {
		$('#status').text(data)
	});

	socket.on('gameover', function() {
		$('#gameover').show();
	});
});