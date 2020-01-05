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
        let container = document.getElementById('tape');
        let player1 = userId;

        for (const t of data.turns) {
            let movie = movies.find(m => m.altId == t.id);
            let tapeBox = document.createElement('div');
            let tapeTitle = document.createElement('div');
            let tapeIcon1 = document.createElement('div');
            let tapeIcon2 = document.createElement('div');
            let matIcon1 = document.createElement('i');
            let matIcon2 = document.createElement('i');

            tapeBox.classList.add('tape-box', 'flex');
            tapeTitle.classList.add('tape-title', 'flex');
            tapeIcon1.classList.add('tape-icon', 'flex');

            matIcon1.classList.add('material-icons');
            matIcon2.classList.add('material-icons');

            tapeIcon2.classList.add('tape-icon', 'flex');

            tapeTitle.innerHTML = `${movie.title} (${movie.year})`;
            
            if (t.guesses.correct == player1) {
                tapeIcon1.classList.add('correct');
                tapeIcon2.classList.add('incorrect');

                matIcon1.innerHTML = 'check_circle';
                matIcon2.innerHTML = 'cancel';
            } else if (t.guesses.correct) {
                tapeIcon1.classList.add('incorrect');
                tapeIcon2.classList.add('correct');

                matIcon1.innerHTML = 'cancel';
                matIcon2.innerHTML = 'check_circle';
            } else {
                tapeIcon1.classList.add('neutral');
                tapeIcon2.classList.add('neutral');

                matIcon1.innerHTML = 'remove_circle_outline';
                matIcon2.innerHTML = 'remove_circle_outline';
            }

            tapeIcon1.appendChild(matIcon1);
            tapeBox.appendChild(tapeIcon1);
            tapeBox.appendChild(tapeTitle);
            tapeIcon2.appendChild(matIcon2);
            tapeBox.appendChild(tapeIcon2);
            container.appendChild(tapeBox);
        }
    }

    function setProgress(u, o) {
        u = u * 10;
        o = o * 10;
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

    function updateVisor(data) {
        $('#visorUser').text(data.userData.username);
        $('#visorUser').attr('data-userId', data.userData.userId);
        $('#userRank').text(`[${data.userData.rank}]`);
        $('#userElo').text(`[${data.userData.elo}]`);

        $('#visorOpponent').text(data.opponentData.username);
        $('#opponentRank').text(`[${data.opponentData.rank}]`);
        $('#opponentElo').text(`[${data.opponentData.elo}]`);
        setProgress(data.userData.score, data.opponentData.score);
    }

    function updateVisorElo(userElo, opponentElo, result) {
        let userColor = (result == 1) ? '#01d277' : '#f44336';
        let opponentColor = (result == 0) ? '#01d277' : '#f44336';

        $('#userElo').text(`[${userElo.elo}]`);
        $('#userEloPoints').text(`[${userElo.points}]`);
        $('#userEloPoints').css('color', userColor);

        $('#opponentElo').text(`[${opponentElo.elo}]`);
        $('#opponentEloPoints').text(`[${opponentElo.points}]`);
        $('#opponentEloPoints').css('color', opponentColor);
    }

    // ===================================================
	// Sockets
	// ===================================================
    socket.on('err', (err) => {
        alert('error check console');
        feedback('error', 'Error', JSON.stringify(err));
    });

    function updateTracking(data) {
        idList = data.game.list;
        currentIndex = data.game.index;
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

    socket.on('advance', function(data) {        
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

    socket.on('winner', function(data) {
        $('#result').text('Congrats, you won!');
        $('#result').css('color', '#01d277');
        updateVisorElo(data.elo, data.opponentElo, 1);
    });

    socket.on('loser', function(data) {
        $('#result').text('You loose.');
        $('#result').css('color', '#f44336');
        updateVisorElo(data.elo, data.opponentElo, 0);
    });

	socket.on('gameover', function(data) {
        console.log('gameover');
        $('.active-display').hide();
        $('#tape').show();
        rollTape(data, list);
    });

    // ===================================================
	// Package
    // ===================================================
    let organize = () => {
        // console.log('organize');
        // console.log(currentIndex);
        // console.log(idList);

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
        $('#prompt').text(`${data.title} (${data.year})`);
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

    $('#resign').click(function() {
        socket.emit('resign', {
            id: currentId
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

    refresh();
    async function refresh() {
        let data = await update();
        list = await getMovieDocs(data.game.parameters.listId);
        updateTracking(data);
        updateVisor(data);
        load();
    }
});