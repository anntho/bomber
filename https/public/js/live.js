$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    // ===================================================
	// Variables
	// ===================================================
    let room = null;
    let currentIndex = 0;
    let currentId = '';
    let cIndex = 0;
    let idList = [];
    let timer = null;
    let counterDefault = 180;
    let counter = 180;
    let interval = 1000;

    // ===================================================
	// Helpers
	// ===================================================
    await $.getScript( "/js/helpers.js");

    function disable() {
        $('.buttons').fadeTo(500, 0.2);
    }

    // ===================================================
	// Sockets
	// ===================================================
    socket.on('err', (err) => {
        alert('error check console');
        feedback('error', 'Error', JSON.stringify(err));
    });

	socket.emit('update');
	socket.on('update', (data) => {
        console.log('updated');
        console.log(data);
        $('#visorUser').text(data.username);
        $('#visorUserRank').text(`${data.rank} [${data.level}]`);

        $('#visorOpponent').text(data.opponentUsername);
        $('#visorOpponentRank').text(`${data.opponentRank} [${data.opponentLevel}]`);
    });
    
	socket.on('connected', function(data) {
        room = data.room;
        idList = data.idList;
        cIndex = data.cIndex;
		console.log(data);
		alert('connected');
	});

	socket.on('msg', function(data) {
		$('#status').text(data)
	});

	socket.on('gameover', function() {
		$('#gameover').show();
    });

    socket.on('next', function() {
        currentIndex = currentIndex + 1;
    });

    // ===================================================
	// Data Sockets
    // ===================================================

    // ===================================================
	// Timer
    // ===================================================
    let updateClock = (c) => {
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
        let id = idList[currentIndex];
        currentId = id;
        let movie = rounds.find(r => r.id === id);
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
        let { movie, choices } = organize();
        
        prompt(movie);
        buttons(choices);
    }

    let logic = async (r) => {
        r = parseInt(r);
        if (r != 1) {
            feedback('error', 'Incorrect');
            return false;
        } else {
            socket.emit('correct', {
                index: currentIndex,
                id: currentId
            });
            return true;
        }
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
        if ($('.button').prop('disabled')) return false;
        $('.button').prop('disabled', true);
        let result = await logic($(this).attr('data-r'));
        if (result) {
            $('.button').prop('disabled', false);
        } else {
            disable();
        }
    });


    // ===================================================
	// Immediate
    // ===================================================
    load();
    startTimer();
});