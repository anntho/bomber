$(document).ready(async function() {
	let socket = io.connect(socketString);

	var ctx = $('#userChart');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Bomber', 'Classic', 'Trivia', 'Articles'],
            datasets: [{
                label: 'Totals',
                data: [chart.bomber, chart.classic, chart.trivia, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
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