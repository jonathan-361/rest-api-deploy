const express = require('express');
const crypto = require('crypto'); // Asegúrate de tener crypto para generar IDs
const movies = require('./movies.json');
const { validateMovie, validatePartialMovie } = require('./schemas/movie.js');

const app = express();
app.use(express.json());
app.disable('x-powered-by');

const ACCEPTED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://movies.com'
];

// Middleware para manejar encabezados CORS
app.use((req, res, next) => {
    const origin = req.header('origin');
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    next();
});

// Manejo de solicitudes OPTIONS
app.options('*', (req, res) => {
    const origin = req.header('origin');
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    res.sendStatus(200);
});

// GET /movies
app.get('/movies', (req, res) => {
    const { genre } = req.query;
    if (genre) {
        const filteredMovies = movies.filter(movie =>
            movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        );
        return res.json(filteredMovies);
    }
    res.json(movies);
});

// GET /movies/:id
app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id == id);
    if (movie) return res.json(movie);

    res.status(404).json({ message: 'Movie not found' });
});

// POST /movies
app.post('/movies', (req, res) => {
    const result = validateMovie(req.body);

    if (!result.success) {
        return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    };
    movies.push(newMovie);

    res.status(201).json(newMovie);
});

// DELETE /movies/:id
app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movieIndex = movies.findIndex(movie => movie.id == id);
    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' });
    }

    movies.splice(movieIndex, 1);

    res.json({ message: 'Movie deleted' });
});

// PATCH /movies/:id
app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body);
    if (!result.success) {
        return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    const { id } = req.params;
    const movieIndex = movies.findIndex(movie => movie.id == id);
    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' });
    }

    const updatedMovie = {
        ...movies[movieIndex],
        ...result.data
    };

    movies[movieIndex] = updatedMovie;

    res.json(updatedMovie);
});

// Error 404 para rutas no encontradas
app.use((req, res) => {
    res.status(404).end('Error 404');
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
});
