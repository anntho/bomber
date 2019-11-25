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
    let cIndex = 0;
    let idList = [];

    // ===================================================
	// Helpers
	// ===================================================
    await $.getScript( "/js/helpers.js");

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

    socket.on('fire', function(data) {
        feedback('info', 'result', data);
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
    let organize = () => {
        let id = idList[index];
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

    let logic = async (text, r) => {
        console.log('emitting', text, r);
        socket.emit('fire', {r: r});
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
        await logic(
            $(this).text(),
            $(this).attr('data-r')
        );
        $('.button').prop('disabled', false);
    });


    // ===================================================
	// Immediate
    // ===================================================
    load();
});