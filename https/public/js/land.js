$(document).ready(function() {
    let socket = io.connect(socketString);

    $('#beta').click(function() {
        socket.emit('find');
    });

    $('#cancel').click(function() {
        socket.emit('cancel');
    });

    socket.on('liveCheckUser', (user) => {
        if (!user) {
            swal({
                icon: 'warning',
                title: 'Not logged in',
                text: 'Please login to try this game mode'
            });
        } else {
            $('#searchModal').modal('open');
        }
    });

    socket.on('connected', function(data) {
        $('#searchModal').modal('close');
        let url = `/live/${data.room}`;
        location.href = url;
    });

    let ctx = $('#myChart');
    let myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Bomber', 'Classic', 'Trivia', 'Community', 'Articles'],
            datasets: [{
                label: 'Totals',
                data: [metrics.bomber, metrics.classic, metrics.trivia, 0, metrics.articles],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(75, 192, 192, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    },
                }]
            }
        }
    });
});