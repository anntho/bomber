$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    // ===================================================
	// Variables
    // ===================================================
    let list = [];
    let room = null;
    let currentIndex = 0;
    let currentId = '';
    let cIndex = 0;
    let idList = [];
    let timer = null;
    let counterDefault = 60;
    let counter = 60; // will need to move this to set via sockets initially
    let interval = 1000;

    // ===================================================
	// Helpers
	// ===================================================
    await $.getScript( "/js/helpers.js");

    function disableBtnDisplay() {
        $('.buttons').fadeTo(500, 0.2);
    }

    function disableBtnClick() {
        $('.button').prop('disabled', true);
    }

    function enableBtn() {
        $('.buttons').fadeTo(100, 1);
        $('.button').prop('disabled', false);
    }

    function rollTape(data, movies) {
        let userId = $('#visorUser').attr('data-userId');
        let player1Tape = document.getElementById('player1Tape');
        let player2Tape = document.getElementById('player2Tape');
        let player1 = userId;

        for (const t of data.turns) {
            let movie = movies.find(m => m.altId == t.id);
            let p1Div = document.createElement('div');
            let p2Div = document.createElement('div');
            p1Div.innerHTML = movie.title;
            p2Div.innerHTML = movie.title;
            
            if (t.guesses.correct == player1) {
                p1Div.classList.add('green-text');
                p2Div.classList.add('red-text');
            } else if (t.guesses.correct) {
                p1Div.classList.add('red-text');
                p2Div.classList.add('green-text');
            } else {
                p1Div.classList.add('red-text');
                p2Div.classList.add('red-text');
            }

            player1Tape.appendChild(p1Div);
            player2Tape.appendChild(p2Div);
        }
    }

    // ===================================================
	// Sockets
	// ===================================================
    socket.on('err', (err) => {
        alert('error check console');
        feedback('error', 'Error', JSON.stringify(err));
    });

    refresh();

    async function refresh() {
        list = await getMovieDocs('109087');
        let data = await update();
        updateTracking(data);
        updateVisor(data);
        load();
    }

    function updateTracking(data) {
        idList = data.game.list;
        currentIndex = data.game.index;
    }

    function updateVisor(data) {
        $('#visorUser').text(data.user.username);
        $('#visorUser').attr('data-userId', data.user.id);
        $('#visorUserRank').text(`${data.user.rank} [${data.user.level}]`);

        $('#visorOpponent').text(data.opp.username);
        $('#visorOpponentRank').text(`${data.opp.rank} [${data.opp.level}]`);

        setProgress(data.u.score, data.opp.score);
    }

    async function update() {
        socket.emit('update');
        return new Promise((res, rej) => {
            socket.on('update', (data) => {
                res(data);
            });
        });
    }

    async function getMovieDocs(id) {
        socket.emit('getMovieDocs', id);
        return new Promise((res, rej) => {
            socket.on('getMovieDocs', (data) => {
                res(data);
            });
        });
    }

    function setProgress(u, o) {
        console.log(u, o);

        if (u == 100) {
            $('.progress.user .determinate').css('background-color', '#01d277');
            $('.progress.user').css('box-shadow', '0 0 10px #01d277');
        }

        if (o == 100) {
            $('.progress.opponent').css('background-color', '#01d277');
            $('.progress.opponent').css('box-shadow', '0 0 10px #01d277');
        }

        if (u < 101 && o < 101) {
            o = 100 - o;
            $('#userProgress').animate({width: `${u}%`}, 200);
            $('#opponentProgress').animate({width: `${o}%`}, 200);
        }
    }

    socket.on('advance', function(data) {
        console.log('advance');
        console.log(data);
        
        currentIndex = data.index;
        if (data.bothWrong) {
            feedback('info', 'Both Wrong!');
        }

        load();
    });
    
	socket.on('connected', function(data) {
        room = data.room;
	});

	socket.on('win', function(data) {
        feedback('success', 'Correct!');
        setProgress(data.userScore, data.opponentScore);
    });

    socket.on('lose', function(data) {
        feedback('error', 'Too slow!');
        setProgress(data.userScore, data.opponentScore);
    });

	socket.on('gameover', function(data) {
        console.log('gameover');
        $('.active-display').hide();
        $('#tape').css('display', 'flex');
        rollTape(data, list);
    });

    // ===================================================
	// Data Sockets
    // ===================================================

    // ===================================================
	// Timer
    // ===================================================
    function updateClock(c) {
        let { minutes, seconds } = secondsToMinutesaAndSeconds(c);
        $('#clockMinutes').text(minutes);
        $('#clockSeconds').text(seconds);
    }

    let step = () => {
        counter--;
        updateClock(counter);
        if (counter === 0) {
            log('time up', null, false);
            resetTimer();
            // this will be game over
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
        counter = counterDefault;
        updateClock(counter);
    }

    // ===================================================
	// Game Over
    // ===================================================



    // ===================================================
	// Stats 
    // ===================================================




    // ===================================================
	// Package
    // ===================================================
    let organize = () => {
        //console.log('organize');
        //console.log(currentIndex);
        //console.log(idList);

        let id = idList[currentIndex];
        currentId = id;

        let movie = list.find(r => r.altId === id);
        let choices = [];
        let correct = {};

        correct = {
           title: movie.correct[cIndex],
           r: 1
        }

        choices.push(correct);

        for (const i of movie.incorrect) {
            choices.push({
                title: i,
                r: -1
            });
        }

        return {
            movie: movie,
            choices: choices
        }
    }

    let prompt = (data) => {
        $('#prompt').text(data.title);
    }

    let buttons = (data) => {
        shuffle(data);
        $('.button').each(function(index) {
            $(this).text(data[index].title);
            $(this).attr('data-r', data[index].r);
        });
    }

    let load = () => {
        enableBtn();
        let { movie, choices } = organize();
        //console.log('movie', movie)
        
        prompt(movie);
        buttons(choices);
    }

    // ===================================================
	// Logic
    // ===================================================




    // ===================================================
	// Restart
    // ===================================================





    // ===================================================
	// Event Listeners & Buttons
    // ===================================================
    $('.button').click(async function() {
        if ($('.button').prop('disabled')) {
            console.log('Btn disabled');
            return false;
        }

        disableBtnClick();

        let correct = false;
        if ($(this).attr('data-r') == 1) {
            correct = true;
        } else {
            disableBtnDisplay();
        }

        socket.emit('guess', {
            index: currentIndex,
            id: currentId,
            correct: correct
        });
    });


    // ===================================================
	// Immediate
    // ===================================================
    let logic = async (correct) => {
        
        socket.emit('guess', {
            index: currentIndex,
            id: currentId
        });

        if (!correct) {
            feedback('error', 'Incorrect');
            return false;
        } else {
            return true;
        }

        return correct;
    }
});