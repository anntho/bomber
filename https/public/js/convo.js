$(document).ready(async function() {
    let socket = io.connect(socketString);

    function feedback(icon, title) {
		swal({
			icon: icon,
			title: title
		});
	}
});