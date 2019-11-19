$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    // ===================================================
	// Variables
	// ===================================================
    let room = null;
    let index = 0;

    // ===================================================
	// Helpers
	// ===================================================
    await $.getScript( "js/helpers.js");

    // ===================================================
	// Sockets
	// ===================================================
    socket.on('err', (err) => {
        alert('error check console');
        report('error', 'Error', JSON.stringify(err));
    });

	socket.emit('update');
	socket.on('update', (data) => {
		room = data.room;
		console.log(room);
		console.log(socket.id);
    });
    
	socket.on('connected', function(data) {
		room = data.room;
		console.log(data);
		alert('connected');
	});

	socket.on('msg', function(data) {
		$('#status').text(data)
	});

	socket.on('gameover', function() {
		$('#gameover').show();
    });

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



    // ===================================================
	// Stats 
    // ===================================================




    // ===================================================
	// Package
    // ===================================================




    // ===================================================
	// Logic
    // ===================================================




    // ===================================================
	// Restart
    // ===================================================





    // ===================================================
	// Event Listeners & Buttons
    // ===================================================



    // ===================================================
	// Immediate
    // ===================================================
    shuffle(rounds);
    console.log(rounds.length);
});