let game = JSON.parse(gameString);
let target = document.querySelector('#grid');

game.forEach(turn => {
    let div = document.createElement('div');
    let sub = document.createElement('div');
    div.classList.add('turn');
    let line = document.createElement('h5');
    line.innerHTML = '-------------------------------';
    if (turn.r == 1) {
        div.innerHTML = `<span class="correct">1</span>${turn.f}`;
        sub.innerHTML = `<span class="guess">Guessed Correctly: ${turn.g}</span>`;
        sub.innerHTML = `<span class="score">Guessed Correctly: ${turn.s}</span>`;
    } else {
        div.innerHTML = `<span class="correct">0</span>${turn.f}`;
        sub.innerHTML = `<span class="guess">Guessed Incorrectly: ${turn.g}</span>`;
        sub.innerHTML = `<span class="score">Guessed Correctly: ${turn.s}</span>`;
    }
    target.appendChild(div);
    div.appendChild(sub);
    sub.appendChild(line);
});