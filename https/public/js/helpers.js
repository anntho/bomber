let log = (func, data, write) => {
    let all = false;
    let none = true;
    if ((write || all) && !none) {
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

let calculator = (result, streak, score, lives) => {
    let points = 10;
    let bonus = null;
    if (result) {
        bonus = 0;
        streak = streak + 1;
        score = score + points;
        if (streak == 2) {
            bonus = 5;
            score = score + bonus;
        }
        if (streak == 5) {
            bonus = 10;
            score = score + bonus;
        }
        if (streak == 10) {
            bonus = 50;
            score = score + bonus;
        }
    } else {
        streak = 0;
        lives = lives - 1;
    }
    return {
        bonus: bonus,
        streak: streak,
        score: score,
        lives: lives
    }
}

let formatTitle = (t, y) => {
    return `${t} (${y})`;
}

let wait = async (ms) => {
    return new Promise(r => setTimeout(r, ms));
}

let padZero = (num) => {
    return ('0' + num).slice(-2);
}

let millisToMinutesAndSeconds = (ms) => {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

let secondsToMinutesaAndSeconds = (s) => {
    let minutes = Math.floor(s / 60);
    let seconds = s - minutes * 60;

    return {
        minutes: minutes,
        seconds: padZero(seconds)
    }
}