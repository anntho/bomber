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
        $('#question').text(question.question);
        $('#title').text((currentIndex + 1) + '/' + questions.length);
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
        $('#score').text(score);
        $('#lives').text(lives);
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
                result('Incorrect', 'error');
                $('#finalScore').text(score);
                document.getElementById('lives').textContent = lives;
                $('#gamebox').hide();
                $('#gameover').show();
            } else if (lives > 0) {
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

    $('#restart').click(function() {
        lives = 6;
        score = 0;
        currentIndex = 0;
        $('#lives').text(lives);
        $('#score').text(score);
        $('#gameover').hide();
        $('#gamebox').show();
    });

    document.querySelectorAll('.button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            logic(btn.textContent);
        });
    });
}); 