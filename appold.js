const express = require('express')
const app = express()
const port = 3000
const { movies, users } = require('./data');

app.get('/', (req, res) => {
    res.send('Hello world')
})

app.get('/api/users', (req, res) => {
    return res.status(200).json({ sucess: true, data: users })
})
app.get('/api/movies/top', (req, res) => {
    // return top movies score = 4 ou 5
    const topMovies = movies.filter(movie => movie.score >= 4);
    return res.status(200).json({ success: true, data: topMovies });
})

app.get('/api/movies/:movie_id', (req, res) => {
    const { movie_id } = req.params;
    const movie = movies.find(movie => movie.id === parseInt(movie_id));
    if (!movie) {
        return res.status(404).json({ success: false, msg: `Nenhum filme com id: ${movie_id}` });
    }
    return res.status(200).json({ success: true, data: movie });
})


app.get('/api/movies/top', (req, res) => {
    // return top movies score = 5
    const topMovies = movies.filter(movie => movie.score === 5);
    return res.status(200).json({ success: true, data: topMovies });
})

app.get('/api/movie/:min-:max', (req, res) => {
    // return movies with score between min and max
    const { min, max } = req.params;
    const moviesFiltered = movies.filter(movie => movie.score >= parseInt(min) && movie.score <= parseInt(max));
    return res.status(200).json({ success: true, data: moviesFiltered });
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
