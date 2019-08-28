$(document).ready(function() {
    var socket = io.connect(socketString);
    var lives = 6;
    var score = 0;
    var currentIndex = 0;

    var shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function setDisplay(question) {
        document.getElementById('question').textContent = question.question;
        document.getElementById('title').textContent = (currentIndex + 1) + '/' + questions.length;
        var list = [];
        list.push(question.correct);
        list.push(question.incorrectFirst);
        list.push(question.incorrectSecond);
        list.push(question.incorrectThird);
        shuffle(list);

        document.querySelectorAll('.button').forEach(function(btn, index) {
            btn.textContent = list[index];
        });
    }
    
    function load() {
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
        var question = questions[currentIndex];
        setDisplay(question);
        currentIndex = currentIndex + 1;
    }

    function logic(guess) {
        var i = currentIndex - 1;
        if (guess === questions[i].correct) {
            score = score + 1;
            result('Correct!', 'success');
        } else {
            lives = lives - 1;
            if (lives === 0) {
                document.getElementById('lives').textContent = lives;
                alert('game over');
            } else {
                result('Incorrect', 'error');
            }
        }
    }

    function result(title, icon) {
        return swal({
            title: title,
            icon: icon,
            closeOnClickOutside: false
        }).then(function() {
            load();
        });
    }

    load();

    document.querySelectorAll('.button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            logic(btn.textContent);
        });
    });
}); 