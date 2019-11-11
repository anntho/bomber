let currentIndex = 0;
let score = 0;
let lives = 6;
let streak = 0;
let timer = null;
let counter = 10;
let interval = 1000;
let package = [];

let testVar = 'fdfds';

let log = (func, data, write) => {
    let all = false;
    if (write || all) {
        console.log('-------------------');
        console.log(func);
        console.log(data);
        console.log('-------------------');
    }
}

let feedback = async (icon, title, text) => {
    return await swal({
        icon: icon,
        title: title,
        text: text,
        closeOnClickOutside: false
    });
}

let shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

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

let updatePackage = (f, g, s, r) => {
    package.push({f: f, g: g, s: s, r: r});
}

let calculator = (result) => {
    let pts = 10;
    let add = null;
    if (result) {
        add = 0;
        streak++;
        score += pts;
        if (streak == 2) {
            add = 5; 
            score += add;
        }
        if (streak == 5) {
            add = 10;
            score += add;
        }
        if (streak == 10) {
            add = 50;
            score += add;
        }
    } else {
        streak = 0;
        lives--;
    }
    return add;
}

let getCast = async (id) => {
    log('getCast', id, false);
    socket.emit('getCast', id);
    return new Promise((res, rej) => {
        socket.on('getCast', async (data) => {
            res(data.cast);
        });
        socket.on('err', async () => {
            rej(reportError());
        });
    });
}

let getMovie = async (id) => {
    log('getMovie', id, false);
    socket.emit('getMovie', id);
    return new Promise((res, rej) => {
        socket.on('getMovie', async (data) => {
            res(data);
        });
        socket.on('err', async () => {
            rej(reportError());
        });
    });
}

let updateStatsDisplay = async (c) => {
    $('#score').text(score);
    $('#streak').text(streak);
    $('#lives').text(lives);

    if (streak > 10 || c == null) {
        $('.dots .material-icons').css('color', '#bbb');
    } else {
        $(`.dots div:nth-child(${streak}) .material-icons`).css('color', '#ffc107');
    }

    if (c) {
        let text = `${streak} in a row (+${c})`;
        await feedback('success', 'Streak Bonus!', text);
    }
}

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