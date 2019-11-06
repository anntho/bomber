let game = JSON.parse(gameString);
let target = document.querySelector('#grid');

game.forEach(turn => {
    let div = document.createElement('div');
    let sub = document.createElement('div');
    let sub2 = document.createElement('div');
    div.classList.add('turn');
    let line = document.createElement('hr');
    if (turn.r == 1) {
        div.innerHTML = `<span class="correct">+1</span> ${turn.f}`;
        sub.innerHTML = `<span class="correct">${turn.g}</span>`;
        sub2.innerHTML = `<span class="s">Score: ${turn.s}</span>`;
    } else {
        div.innerHTML = `<span class="incorrect">+0</span> ${turn.f}`;
        sub.innerHTML = `<span class="incorrect">${turn.g}</span>`;
        sub2.innerHTML = `<span class="s">Score: ${turn.s}</span>`;
    }
    target.appendChild(div);
    div.appendChild(sub);
    sub.appendChild(sub2);
    sub2.appendChild(line);
});