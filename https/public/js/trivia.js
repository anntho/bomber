$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    // ===================================================
	// Variables
	// ===================================================
    let package = [];
    let sid = '';
    let timer = null;
    let counter = 10;
    let interval = 1000;

    // ===================================================
	// Helpers
	// ===================================================
    await $.getScript( "js/helpers.js");

    // ===================================================
	// Sockets
	// ===================================================
    socket.on('game', function(data) {
        log('sid received', data, false);
        sid = data;
    });

    let emitGame = (event, sid) => {
        socket.emit('game', {
            score: score || 0,
            event: event,
            mode: 'trivia',
            participants: 1,
            sid: sid,
            package: package
        });
    }

    // ===================================================
	// Data Sockets
    // ===================================================

    // ===================================================
	// Timer
    // ===================================================
    let step = () => {
        counter--;
        $('#timer').text(counter);
        if (counter === 0) {
            log('time up', null, false);
            resetTimer();
            logic(null);
        }
    }

    let startTimer = () => {
        if (timer !== null) return;
        log('starting timer', null, false);
        timer = setInterval(step, interval);
    }

    let stopTimer = () => {
        log('stopping timer', null, false);
        resetTimer();
    }
    
    let resetTimer = () => {
        clearInterval(timer);
        timer = null;
        counter = 10;
        $('#timer').text(counter);
    }

    // ===================================================
	// Game Over
    // ===================================================
    let gameOver = () => {
        $('#finalScore').text(score);
        hideGamebox();
    }
    
    let hideGamebox = () => {
        $('#board').css('display', 'none');
        $('#go').css('display', 'block');
    }
    
    let showGamebox = () => {
        $('#board').css('display', 'block');
        $('#go').css('display', 'none');
    }

    // ===================================================
	// Stats 
    // ===================================================
    let updateStats = async (calc) => {
        score = calc.score;
        streak = calc.streak;
        lives = calc.lives;
        $('#score').text(score);
        $('#streak').text(streak);
        $('#lives').text(lives);

        if (streak > 10 || calc.bonus == null) {
            $('.dots .material-icons').css('color', '#bbb');
        } else {
            $(`.dots div:nth-child(${streak}) .material-icons`).css('color', '#ffc107');
        }

        if (calc.bonus) {
            let text = `${streak} in a row (+${calc.bonus})`;
            await feedback('success', 'Streak Bonus!', text);
        }
    }

    // ===================================================
	// Package
    // ===================================================
    let updatePackage = (from, guess, score, result) => {
        package.push({f: from, g: guess, s: score, r: result});
    }

    // ===================================================
	// Display
    // ===================================================
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

    // ===================================================
	// Logic
    // ===================================================
    let logic = async (guess) => {
        currentIndex++;
        let calc = null;
        let r = -1;
        let i = currentIndex - 1;
        let correct = questions[i].correct;
        let question = questions[i].question;
        
        if (guess == correct) {
            calc = calculator(true, score, streak, lives);
            await feedback('success', 'Correct!');
        } else if (guess == null) {
            calc = calculator(false, score, streak, lives);
            await feedback('error', 'Out of time!', `The correct answer was ${correct}`);
        } else {
            calc = calculator(false, score, streak, lives);
            await feedback('error', 'Incorrect', `The correct answer was ${correct}`);
        }

        await updateStats(calc);
        updatePackage(question, 'none', score, r);

        if (lives < 1 || currentIndex == questions.length) {
            log('game over', null, false);
            emitGame('end', sid);
            await gameOver();
        } else {
            await loadQuestion(false);
        }
    }

    // ===================================================
	// Restart
    // ===================================================
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

    // ===================================================
	// Event Listeners & Buttons
    // ===================================================
    $('.button').click(async function() {
        if ($('.button').prop('disabled')) return false;
        $('.button').prop('disabled', true);
        stopTimer();
        if (currentIndex == 0) {
            emitGame('start', null);
        }
        await logic($(this).text());
        $('.button').prop('disabled', false);
    });

    $('#restart').click(async function() {
        restartGame();
        showGamebox();
    });

    // ===================================================
	// Immediate
    // ===================================================
    shuffle(questions);
    loadQuestion(true);
}); 