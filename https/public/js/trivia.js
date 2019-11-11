$(document).ready(async function() {
    await $.getScript( "js/helpers.js");
    let socket = io.connect(socketString);
    let sid = '';
    let package = [];

    socket.on('game', function(data) {
        log('sid received', data, false);
        sid = data;
    });

    let updatePackage = (f, g, s, r) => {
        package.push({f: f, g: g, s: s, r: r});
    }

    let loadQuestion = (initial) => {
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

    let logic = async (guess) => {
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
            log('game over', null, false);
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
        if ($('.button').prop('disabled')) return false;
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

    let restartGame = () => {
        shuffle(questions);
        currentIndex = 0;
        score = 0;
        lives = 6;
        correct = '';
        package = [];
        loadQuestion(true);
        updateStatsDisplay(null);
    }

    $('#restart').click(async function() {
        restartGame();
        showGamebox();
    });

    shuffle(questions);
    loadQuestion(true);
}); 