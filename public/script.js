const gameList = document.getElementById('game-list');
const form = document.getElementById('create-game-form');
const gameNameInput = document.getElementById('game-name');

// Initialisation de la connexion WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Fonction pour charger les parties depuis l'API
async function loadGames() {
    try {
        const response = await fetch('/api/games');
        const games = await response.json();

        // Vide la liste avant de recharger les données
        gameList.innerHTML = '';
        games.forEach(addGameToUI);
    } catch (err) {
        console.error('Erreur lors du chargement des parties:', err);
    }
}

// Charger les parties au démarrage
window.onload = loadGames;

// Écouter les messages WebSocket
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'NEW_GAME') {
        addGameToUI(message.data);
    } else if (message.type === 'DELETE_GAME') {
        document.getElementById(`game-${message.data}`)?.remove();
    } else if (message.type === 'FINISH_GAME') {
        const game = document.getElementById(`game-${message.data}`);
        if (game) {
            game.classList.add('finished');
        }
    }
};

// Gérer la soumission du formulaire
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = gameNameInput.value;

    try {
        await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        gameNameInput.value = '';
        await loadGames(); // Recharge la liste des parties après création
    } catch (err) {
        console.error('Erreur lors de la création de la partie:', err);
    }
});

// Ajouter une partie à l'interface utilisateur
function addGameToUI(game) {
    // Vérifie si la partie existe déjà pour éviter les doublons
    if (document.getElementById(`game-${game.id}`)) {
        return;
    }

    // Crée un nouvel élément pour la partie
    const div = document.createElement('div');
    div.id = `game-${game.id}`;
    div.className = 'game' + (game.status === 'finished' ? ' finished' : '');
    div.innerHTML = `
        <span>${game.name} ${game.status === 'finished' ? '(Terminé)' : ''}</span>
        <div class="actions">
            <button onclick="finishGame(${game.id})">Terminer</button>
            <button onclick="deleteGame(${game.id})">Supprimer</button>
        </div>
    `;
    gameList.appendChild(div);
}

// Terminer une partie
async function finishGame(id) {
    try {
        await fetch(`/api/games/${id}`, {
            method: 'PATCH',
        });
    } catch (err) {
        console.error('Erreur lors de la finition de la partie:', err);
    }
}

// Supprimer une partie
async function deleteGame(id) {
    try {
        await fetch(`/api/games/${id}`, {
            method: 'DELETE',
        });
    } catch (err) {
        console.error('Erreur lors de la suppression de la partie:', err);
    }
}
function updateCounter() {
    const ongoingGames = document.querySelectorAll('.game:not(.finished)').length;
    document.getElementById('ongoing-counter').textContent = ongoingGames;
}

