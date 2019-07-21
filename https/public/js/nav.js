$(document).ready(async function() {
	console.log('nav js')

	$(document).ready(function() {
		$('#navSearch').on('click', function(evt) {
			if (evt.which == 13) {
				alert('entered')
			}
		})
	});
});