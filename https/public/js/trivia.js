$(document).ready(function() {
    var socket = io.connect(socketString);
    var questions = [];
    var currentIndex = 0;
    
    socket.emit('getQuestions');
    socket.on('getQuestions', function(data) {
        console.log(data.length);
        questions = data;
    });

    var shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function init() {
        console.log(questions)

        //setDisplay(questions[currentIndex].question);
    }

    function setDisplay(text) {
        var question = document.getElementById('question');
        question.textContent = text;
    }

    init();

}); 