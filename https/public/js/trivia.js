$(document).ready(function() {
    let socket = io.connect(socketString);
    let currentIndex = 0;
    let score = 0;
    let lives = 6;
    let streak = 0;
    let package = [];
    let sid = '';
    let log = false;
    let timer = null;
    let counter = 10;
    let interval = 1000;

    shuffle(questions);
    loadQuestion(true);

    socket.on('game', function(data) {
        if (log) console.log('sid received', data);
        sid = data;
    });

    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function step() {
        counter--;
        $('#timer').text(counter);
        if (counter === 0) {
            if (log) console.log('time up');
            resetTimer();
            logic(null);
        }
    }

    function startTimer() {
        if (timer !== null) return;
        if (log) console.log('starting timer');
        timer = setInterval(step, interval);
    }

    function stopTimer() {
        if (log) console.log('stopping timer');
        resetTimer();
    }

    function resetTimer() {
        clearInterval(timer);
        timer = null;
        counter = 10;
        $('#timer').text(counter);
    }

    function loadQuestion(initial) {
        let question = questions[currentIndex];

        $('#question').text(question.question);
        let list = [];
        list.push(question.correct);
        list.push(question.incorrectFirst);
        list.push(question.incorrectSecond);
        list.push(question.incorrectThird);
        shuffle(list);

        $('.button').each(function(index) {
            $(this).text(list[index]);
        });

        if (!initial) {
            startTimer();
        }
    }

    async function logic(guess) {
        currentIndex++;
        let c = null;
        let i = currentIndex - 1;
        let correct = questions[i].correct;
        let question = questions[i].question;
        
        if (guess == correct) {
            updatePackage(question, guess, score, 1);
            c = calculator(true);
            await feedback('success', 'Correct!');
        } else if (guess == null) {
            updatePackage(question, 'none', score, -1);
            c = calculator(false);
            await feedback('error', 'Out of time!', `The correct answer was ${correct}`);
        } else {
            updatePackage(question, guess, score, -1);
            c = calculator(false);
            await feedback('error', 'Incorrect', `The correct answer was ${correct}`);
        }

        await updateStatsDisplay(c);

        if (lives < 1 || currentIndex == questions.length) {
            if (log) console.log('game over');
            socket.emit('game', {
				score: score,
				event: 'end',
				mode: 'trivia',
				participants: 1,
                sid: sid,
                package: package
			});
            await gameOver();
        } else {
            await loadQuestion(false);
        }
    }

    $('.button').click(async function() {
        if ($('.button').prop('disabled')) {
            return false;
        }
        $('.button').prop('disabled', true);
        stopTimer();
        if (currentIndex == 0) {
            socket.emit('game', {
			    score: score || 0,
				event: 'start',
				mode: 'trivia',
				participants: 1,
				sid: null
			});
        }
        await logic($(this).text());
        $('.button').prop('disabled', false);
    });

    function calculator(result) {
        let pts = 10;
        let add = null;
        if (result) {
            add = 0;
            streak++;
            score += pts;
            if (streak == 2) {
                add = 5; 
                score += add;
            }
            if (streak == 5) {
                add = 10;
                score += add;
            }
            if (streak == 10) {
                add = 50;
                score += add;
            }
        } else {
            streak = 0;
            lives--;
        }
        return add;
    }

    function updatePackage(m, g, s, r) {
        package.push({m: m, g: g, s: s, r: r});
    }

    async function updateStatsDisplay(c) {
        $('#score').text(score);
        $('#streak').text(streak);
        $('#lives').text(lives);

        if (streak > 10 || c == null) {
            $('.dots .material-icons').css('color', '#bbb');
        } else {
            $(`.dots div:nth-child(${streak}) .material-icons`).css('color', '#ffc107');
        }

        if (c) {
            let text = `${streak} in a row (+${c})`;
            await feedback('success', 'Streak Bonus!', text);
        }
    }

    async function feedback(icon, title, text) {
        return await swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
    }

    $('#restart').click(async function() {
        restartGame();
        showGamebox();
    });

    function restartGame() {
        shuffle(questions);
        currentIndex = 0;
        score = 0;
        lives = 6;
        correct = '';
        package = [];
        loadQuestion(true);
        updateStatsDisplay(null);
    }

    async function gameOver() {
        $('#finalScore').text(score);
        hideGamebox();
    }

    function hideGamebox() {
        $('#board').css('display', 'none');
        $('#go').css('display', 'block');
    }

    function showGamebox() {
        $('#board').css('display', 'block');
        $('#go').css('display', 'none');
    }
}); 