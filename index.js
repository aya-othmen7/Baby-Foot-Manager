const express = require('express');
const { WebSocketServer } = require('ws');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocketServer({ server });

const { Pool } = require('pg');

app.use(express.static('public')); // Serve les fichiers statiques (HTML, CSS, JS côté client)
app.use(express.json()); // Permet de lire les corps de requêtes JSON

// Établir la connexion WebSocket
wss.on('connection', (socket) => {
    console.log('Client connecté via WebSocket');
    socket.send(JSON.stringify({ type: 'WELCOME', message: 'Bienvenue sur BabyFoot Manager !' }));
});

server.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'babyfoot',
    password: '9529', 
    port: 5432,
});

// Test de la connexion à la base de données
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erreur de connexion à la base de données', err);
    } else {
        console.log('Connexion à PostgreSQL réussie ! Heure actuelle :', res.rows[0].now);
    }
});
//Récupérer la liste des parties
app.get('/api/games', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la récupération des parties');
    }
});
//Créer une nouvelle partie
app.post('/api/games', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query('INSERT INTO games (name) VALUES ($1) RETURNING *', [name]);
        // Notification via WebSocket
        wss.clients.forEach(client => {
            client.send(JSON.stringify({ type: 'NEW_GAME', data: result.rows[0] }));
        });
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la création de la partie');
    }
});
//Supprimer une partie
app.delete('/api/games/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM games WHERE id = $1', [id]);
        // Notification via WebSocket
        wss.clients.forEach(client => {
            client.send(JSON.stringify({ type: 'DELETE_GAME', data: id }));
        });
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la suppression de la partie');
    }
});
// Terminer une partie
app.patch('/api/games/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE games SET status = $1 WHERE id = $2', ['finished', id]);
        // Notification via WebSocket
        wss.clients.forEach(client => {
            client.send(JSON.stringify({ type: 'FINISH_GAME', data: id }));
        });
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la mise à jour de la partie');
    }
});

