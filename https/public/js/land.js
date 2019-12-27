$(document).ready(function() {
    let socket = io.connect(socketString);
    let refreshTime = 5000;
    let refreshInterval = setInterval(updateLobby, refreshTime);
    
    function updateLobby() {
        socket.emit('lobby');
    }

    function stopRefresh() {
        clearInterval(refreshInterval);
    }

    $('.search').click(function() {
        socket.emit('search', {
            count: $(this).attr('data-count'),
            mode: $(this).attr('data-mode')
        });
    });

    $('#cancel').click(function() {
        socket.emit('cancel');
    });

    $('#lobby').on('click', 'tr', function() {
        let id = $(this).attr('id');
        socket.emit('joinById', {
            room: id
        });
    });

    socket.on('liveCheckUser', (user) => {
        if (!user) {
            swal({
                icon: 'warning',
                title: 'Not logged in',
                text: 'Please login to try this game mode'
            });
        } else {
            $('#searchModal').modal('open');
        }
    });

    socket.on('removeFromLobby', function(data) {
        removeElement(data.room);
    });

    socket.on('connected', function(data) {
        $('#searchModal').modal('close');
        let url = `/live/${data.room}`;
        location.href = url;
    });

    socket.emit('lobby');
    socket.on('lobby', function(data) {
        makeLobby(data);
    });
});

function makeLobby(data) {
    let container = document.getElementById('lobby');
    let rows = document.querySelectorAll('.lobby-row');

    rows.forEach(row => {
        let hangingAround = data.find(game => game.room == row.id);
        if (!hangingAround) {
            removeElement(row.id);
        }
    });

    data.forEach(game => {
        let exists = document.getElementById(game.room);
        if (!exists) {
            let row = document.createElement('tr');
            let username = document.createElement('td');
            let elo = document.createElement('td');
            let rank = document.createElement('td');
            let mode = document.createElement('td');
            row.setAttribute('id', game.room);
            row.classList.add('lobby-row');
            row.classList.add('point');
            username.innerHTML = game.players[0].username;
            elo.innerHTML = game.players[0].elo;
            rank.innerHTML = game.players[0].rank;
            mode.innerHTML = `${game.parameters.count} | ${game.parameters.mode}`;
            row.appendChild(username);
            row.appendChild(elo);
            row.appendChild(rank);
            row.appendChild(mode);
            container.appendChild(row);
        }
    });
}

function removeElement(elementId) {
    let element = document.getElementById(elementId);
    if (element) {
        element.parentNode.removeChild(element);
    }
}