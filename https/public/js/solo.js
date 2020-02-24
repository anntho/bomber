let board = new Vue({
    el: '#board',
    data: function() {
        return {
            socket: io.connect(socketString),
            loading: true,
            gameover: false,
            index: 0,
            movie: {
                title: '',
                opts: [
                    {text: '', correct: 0},
                    {text: '', correct: 0},
                    {text: '', correct: 0},
                    {text: '', correct: 0}
                ]
            },
            movies: [],
            user: {
                score: 0,
                lives: 10
            },
            correct: 0,
            progress: '0%'
        }
    },
    mounted() {
        console.log('Mounted');
        this.socket.emit('getAllMovies');
        this.socket.on('getAllMovies', (data) => {
            this.movies = this.shuffle(data);
            this.load();
        });
    },
    watch: {
        index: function() {
            this.load();
        }
    },
    computed: {
        current: function() {
            return this.index + 1;
        }
    },
    methods: {
        restart: function() {
            console.log('restarting')
            this.index = 0;
            this.movies = this.shuffle(this.movies);
            this.user.score = 0;
            this.user.lives = 10;
            this.correct = 0;
            this.progress = '0%';
            this.load();
            this.gameover = false;
        },
        shuffle: function(a) {
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        random: function(l) {
            return Math.floor(Math.random() * l) + 1;
        },
        next: function() {
            this.index++;
        },
        load: function() {
            let opts = [];
            let movie = this.movies[this.index];
            let incorrect = this.shuffle(movie.incorrect);
            incorrect = this.shuffle(incorrect).slice(0, 3);
            incorrect.forEach(function(choice) {
                opts.push({text: choice, correct: 0});
            });
            let correct = movie.correct[this.random(1)];
            opts.push({text: correct, correct: 1});
            opts = this.shuffle(opts);

            this.movie.title = `${movie.title} (${movie.year})`;
            this.movie.opts = opts;
            this.loading = false;
        },
        check: function(c) {
            this.loading = true;
            if (c == 1) {
                this.feedback('success', 'Correct!');
                this.index++;
                this.user.score++;
                this.correct++;
            } else {
                let correct = this.movie.opts.find(m => m.correct ==1).text;
                let message = `The correct answer was ${correct}`;
                this.feedback('error', 'Incorrect', message);
                this.user.lives--;

                let width = parseInt(this.progress.split('%')[0]);
                width = width + 10;
                this.progress = `${width}%`;

                if (this.user.lives == 0) {
                    this.gameover = true;
                } else {
                    this.index++;
                }
            }
        },
        feedback: function(i, t, m) {
            return swal({
                icon: i,
                title: t,
                text: m
            });
        }
    }
});

