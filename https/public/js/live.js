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
        $('#list').text(list[0].list);
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

    function setProgress(uProgress, oProgress) {
        console.log(uProgress, oProgress);
        oProgress = 100 - oProgress;
        $('#userProgress').width(`${uProgress}%`);
        $('#opponentProgress').width(`${oProgress}%`);
    }

    socket.on('advance', function(data) {
        console.log('advance');
        console.log(data);

        if (data.userProgress == 100) {
            location.href = '/win';
            socket.emit('close');
        } else if (data.oppProgress == 100) {
            location.href = '/lose';
            socket.emit('close');
        } else {
            currentIndex = data.index;
            console.log('data index', data.index)
            console.log('current index', currentIndex)
            if (data.bothWrong) {
                feedback('info', 'Both Wrong!');
            }
            load();
        }
    });
    
	socket.on('connected', function(data) {
        //console.log('connected');
        //console.log(data);
        room = data.room;
	});

	socket.on('win', function(data) {
        feedback('success', 'Correct!');
        setProgress(data.uscore, data.oscore);
    });

    socket.on('lose', function(data) {
        feedback('error', 'Too slow!');
        setProgress(data.uscore, data.oscore);
    });

	socket.on('gameover', function() {
		$('#gameover').show();
    });

    // socket.on('next', function() {
    //     currentIndex = currentIndex + 1;
    // });

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

        let id = idList[currentIndex].id;
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