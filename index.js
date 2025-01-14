const express = require('express');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'babyfoot',
    password: '9529',
    port: 5432,
});

app.use(express.static('public')); // Sert les fichiers statiques
app.use(express.json()); // Permet de lire les corps de requêtes JSON

// Connexion WebSocket
wss.on('connection', (socket) => {
    console.log('Client connecté via WebSocket');
    socket.send(JSON.stringify({ type: 'WELCOME', message: 'Bienvenue sur BabyFoot Manager !' }));
});

// Envoyer régulièrement le temps écoulé pour chaque partie
setInterval(async () => {
    try {
        const result = await pool.query('SELECT id, created_at FROM games WHERE status != $1', ['finished']);
        const games = result.rows;

        // Calculer le temps écoulé pour chaque partie et l'envoyer aux clients
        games.forEach(game => {
            const elapsedTime = Math.floor((Date.now() - new Date(game.created_at).getTime()) / 1000); // Temps en secondes
            wss.clients.forEach(client => {
                client.send(JSON.stringify({
                    type: 'UPDATE_GAME_TIME',
                    data: { id: game.id, elapsed_time: elapsedTime }
                }));
            });
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour des temps:', err);
    }
}, 1000); // Toutes les 10 secondes

// Démarrer le serveur
server.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});

// Récupérer la liste des parties
app.get('/api/games', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la récupération des parties');
    }
});
// Route pour obtenir le nombre de parties en cours
app.get('/api/games/in-progress', async (req, res) => {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM games WHERE status != $1', ['finished']);
      res.json({ inProgress: result.rows[0].count });
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).send('Server error');
    }
  });
  

// Créer une nouvelle partie
app.post('/api/games', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query('INSERT INTO games (name) VALUES ($1) RETURNING *', [name]);

        // Notification via WebSocket avec le temps écoulé initial
        const elapsedTime = 0; // Au moment de la création, le temps est 0
        wss.clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'NEW_GAME',
                data: { ...result.rows[0], elapsed_time: elapsedTime }
            }));
        });
        updateOngoingGamesCount(); // Mi
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la création de la partie');
    }
});

// Supprimer une partie
app.delete('/api/games/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM games WHERE id = $1', [id]);

        // Notification via WebSocket
        wss.clients.forEach(client => {
            client.send(JSON.stringify({ 
                type: 'DELETE_GAME', data: id }));
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
            client.send(JSON.stringify({ type:'FINISH_GAME', data: id }));
        });
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la mise à jour de la partie');
    }
});

// Mettre à jour le compteur des parties non terminées
function updateCounter() {
    const ongoingGames = document.querySelectorAll('.game:not(.finished)').length;
    ongoingCounter.textContent = `${ongoingGames} parties en cours`; // Mise à jour du texte du compteur
}
// Après chaque événement WebSocket, envoyer la mise à jour du nombre de parties en cours
async function updateOngoingGamesCount() {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM games WHERE status != $1', ['finished']);
        const ongoingCount = result.rows[0].count;

        // Envoi du nombre de parties en cours à tous les clients
        wss.clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'UPDATE_ONGOING_COUNT',
                data: ongoingCount
            }));
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du compteur des parties en cours:', err);
    }
}




