let game = JSON.parse(gameString);
console.log(game);

let target = document.querySelector('#grid');

game.forEach(turn => {
    let div = document.createElement('div');
    let sub = document.createElement('div');
    div.classList.add('turn');
    //let line = document.createElement('p');
    //line.innerHTML = '---------';
    if (turn.r == 1) {
        div.innerHTML = '<span class="correct">' + '+1' + '</span> ' + turn.m;
        sub.innerHTML = '<span class="guess">' + turn.g + '</span>';
    } else {
        div.innerHTML = '<span class="incorrect">' + '+0' + '</span> ' + turn.m;
        sub.innerHTML = '<span class="guess">' + turn.g + '</span>';
    }
    target.appendChild(div);
    div.appendChild(sub);
    //sub.appendChild(line);
});