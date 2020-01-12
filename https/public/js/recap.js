$(document).ready(function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    // ===================================================
	// Logic
	// ===================================================
    load();
    async function load() {
        let movies = await getMovieDocs(gameData.parameters.listId);
        display(gameData, movies);
    }

    async function getMovieDocs(id) {
        socket.emit('getMovieDocs', id);
        return new Promise((res, rej) => {
            socket.on('getMovieDocs', (data) => {
                res(data);
            });
        });
    }

    function display(game, movies) {
        let player1 = game.players[0];
        let player2 = game.players[1];

        console.log(player1.userId, player2.userId)

        // 1. username & rank
        $('#visorUser').text(player1.username);
        $('#userRank').text(`[${player1.rank}]`);
        $('#visorOpponent').text(player2.username);
        $('#opponentRank').text(`[${player2.rank}]`);

        // 2. elo
        let result = (player1.userId == game.winner) ? 1 : 0;
        updateVisorElo(player1.new, player2.new, result);
        setProgress(player1.score, player2.score, game.parameters.count);
        rollTape(player1.userId, game, movies);
    }
});

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


function setProgress(u, o, c) {
    let total = c;
    let userScore = u;
    let opponentScore = o;
    let userPercent = (userScore / total) * 100;
    let opponentPercent = (opponentScore / total) * 100;

    if (userPercent == 100) {
        $('.progress.user .determinate').css('background-color', '#01d277');
        $('.progress.user').css('box-shadow', '0 0 10px #01d277');
    }

    if (opponentPercent == 100) {
        $('.progress.opponent').css('background-color', '#01d277');
        $('.progress.opponent').css('box-shadow', '0 0 10px #01d277');
    }

    if (userScore <= 100 && opponentScore <= 100) {
        opponentPercent = 100 - opponentPercent;
        $('#userProgress').animate({width: `${userPercent}%`}, 100);
        $('#opponentProgress').animate({width: `${opponentPercent}%`}, 100);
    }
}

function rollTape(player1, data, movies) {
    let container = document.getElementById('tape');
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