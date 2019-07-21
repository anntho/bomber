$(document).ready(async function() {
    var currentIndex = 0;
    var score = 0;
    var lives = 6;
    var actors = [];
    var movies = [];
    var movieIds = [];
    var correct = '';

    await loadLists();
    await loadMovie(movieIds[currentIndex]);

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async function loadLists() {
        var fetchMovies = await fetch('/data/movie_list');
        movies = await fetchMovies.json();
        movies.forEach(movie => {
            movieIds.push(movie.altId);
        });
        shuffle(movieIds);
        var fetchActors = await fetch('/data/actor_list');
        actors = await fetchActors.json();
    }

    function setPosterAndTitle(url, title, year) {
        $('#poster').css('background-image', url);
        $('#loader').css('display', 'none');
        $('#title').text(`${title} (${year})`);
    }

    function loaderOn() {
        $('#loader').css('display', 'block');
        $('#poster').css('display', 'none');
    }

    function loaderOff() {
        $('#loader').css('display', 'none');
        $('#poster').css('display', 'block');
        var elm = document.getElementById('poster');
        var newone = elm.cloneNode(true);
        elm.parentNode.replaceChild(newone, elm);
    }

    async function loadMovie(id) {
        loaderOn();
        var movie = movies.find(movie => movie.altId == id);
        var url = `url(https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster})`;

        setPosterAndTitle(url, movie.title, movie.year);
        loaderOff();

        var fetchCast = await fetch(`/data/movie/cast/${id}`);
        var fetchDetails = await fetch(`/data/movie/${id}`);
        var details = await fetchDetails.json();

        $('#overview').text(details.overview);
        var cast = await fetchCast.json();
        var names = [];
        cast.forEach(c => {
            names.push(c.name);
        });
        var index = Math.floor(Math.random() * 10);
        var actor = names[index];
        correct = actor;
        var list = [];
        list.push(actor);
        shuffle(actors);
        actors.forEach(a => {
            if ((list.length < 4) && (!names.includes(a.name))) {
                list.push(a.name);
            }
        });
        shuffle(list);
        $('.button').each(function(index) {
            $(this).text(list[index]);
        });
    }
    
    async function postScore(data) {
        return await fetch("/scores", {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(data)
        });
    }

    function displayCorrect(btn) {
        btn.css('color', '#4caf50');
        btn.css('background-color', '#def4c4');
    }

    function displayIncorrect(btn) {
        btn.css('background-color', '#f0beba');
        btn.css('color', '#cf180a');
    }

    function resetColors(btn) {
        btn.css('color', '#11173b');
        btn.css('background-color', '#fff');
    }

    function hideGamebox() {
        $('.gamebox').css('display', 'none');
        $('.gameover').css('display', 'block');
    }

    function showGamebox() {
        $('.gamebox').css('display', 'block');
        $('.gameover').css('display', 'none');
    }

    async function gameOver() {
        hideGamebox();
        restartGame();

        let obj = {
            title: "Game Over",
            text: "Enter a username",
            content: "input",
            button: {
                text: "Submit",
                closeModal: false
            },
            closeOnClickOutside: false
        };

        try {
            let username = await swal(obj);
            if (!username) {
                swal.stopLoading();
                swal.close();
            } else {
                let data = {
                    Score: score,
                    Name: username,
                    Mode: "classic"
                };
                let requestObj = {
                    method: "post",
                    mode: "cors",
                    cache: "no-cache",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify(data)
                }
                let response = await fetch("/scores", requestObj);
                let resJSON = await response.json();
                if (!resJSON || response.status != 200) {
                    await swal({
                        icon: "error",
                        title: "Error",
                        text: "Whoops an error occured posting your score.",
                        closeOnClickOutside: false
                    });
                } else {
                    await swal({
                        icon: "success",
                        title: "Success!",
                        text: "Your score has been posted",
                        closeOnClickOutside: false
                    });
                    $('#myscore').attr('href', `/board?u=${resJSON.name}`);
                    $('#myscore').css('display', 'block');
                }
            }
        }  catch (err) {
            console.log(err)
            swal.stopLoading();
            swal.close();
        }
    }

    async function guessLogic(guess, btn) {
        currentIndex++;
        if (guess == correct) {
            score++;
            $('#score').text(score);
            await swal({
                icon: 'success',
                text: 'Correct!',
                closeOnClickOutside: false
            });
        } else {
            lives--;
            $('#lives').text(lives);
            await swal({
                icon: 'error',
                text: `The correct answer was ${correct}`,
                closeOnClickOutside: false
            });
        }
    }

    $('.button').click(async function() {
        if ($('.button').prop('disabled')) {
            return false;
        }
        $('.button').prop('disabled', true);
        await guessLogic($(this).text(), $(this));
        if (lives < 1) {
            await gameOver();
        } else {
            await loadMovie(movieIds[currentIndex]);
        }
        $('.button').prop('disabled', false);
    });

    $('i.replay').click(async function() {
        showGamebox();
    });

    function restartGame() {
        shuffle(movies)
        var currentIndex = 0;
        var score = 0;
        var lives = 6;
        var correct = '';
        $('#score').text(score);
        $('#lives').text(lives);
    }
});

