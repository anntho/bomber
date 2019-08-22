$(document).ready(function() {
    console.log(metrics)
    var ctx = $('#myChart');
    var myChart = new Chart(ctx, {
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