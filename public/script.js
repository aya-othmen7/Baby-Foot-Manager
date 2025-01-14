const gameList = document.getElementById('game-list');
const form = document.getElementById('create-game-form');
const gameNameInput = document.getElementById('game-name');
const ongoingCounter = document.getElementById('ongoing-counter'); // Élément du compteur

let ongoingGamesCount = 0; // Compteur global des parties en cours
let gameTimers = {}; // Objet pour stocker les timers des parties

// Initialisation de la connexion WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Fonction pour charger les parties depuis l'API
async function loadGames() {
    try {
        const response = await fetch('/api/games');
        const games = await response.json();

        // Vide la liste avant de recharger les données
        gameList.innerHTML = '';
        games.forEach(game => {
            addGameToUI(game);
            if (game.status !== 'finished') {
                startGameTimer(game); // Démarrer le timer seulement pour les parties en cours
            }
        });
    } catch (err) {
        console.error('Erreur lors du chargement des parties:', err);
    }
}

// Charger les parties au démarrage
window.onload = loadGames;

// Récupérer le nombre de parties en cours au chargement de la page
fetch('/api/games/in-progress')
  .then(response => response.json())
  .then(data => {
    document.getElementById('in-progress-count').innerText = data.inProgress;
  });

// WebSocket pour écouter les événements en temps réel
const socket = new WebSocket('ws://localhost:3000');

// Lorsque l'état des parties change, mettez à jour le compteur
socket.addEventListener('message', function (event) {
  const data = JSON.parse(event.data);
  if (data.type === 'update') {
    // Récupérer à nouveau le nombre de parties en cours
    fetch('/api/games/in-progress')
      .then(response => response.json())
      .then(data => {
        document.getElementById('in-progress-count').innerText = data.inProgress;
      });
  }
});

// Écouter les messages WebSocket
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'NEW_GAME') {
        addGameToUI(message.data);
        if (message.data.status !== 'finished') {
            startGameTimer(message.data); // Démarre le timer de la nouvelle partie
        }
        updateCounter(); // Mettre à jour le compteur après ajout d'une nouvelle partie
    } else if (message.type === 'DELETE_GAME') {
        document.getElementById(`game-${message.data}`)?.remove();
        updateCounter(); // Mettre à jour le compteur après suppression
    } else if (message.type === 'FINISH_GAME') {
        const game = document.getElementById(`game-${message.data}`);
        if (game) {
            game.classList.add('finished');
            updateCounter(); // Mettre à jour le compteur après la fin de la partie
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
    const div = document.createElement('div');
    div.id = `game-${game.id}`;
    div.className = 'game' + (game.status === 'finished' ? ' finished' : '');
    div.innerHTML = `
        <span>${game.name} ${game.status === 'finished' ? '' : ''}</span>
        <div id="timer-${game.id}" class="timer">00:00</div> <!-- Affichage du timer -->
        <div class="actions">
            <button onclick="finishGame(${game.id})">
                <i class="fas fa-flag-checkered"></i></button>
            </button>
            <!-- Icône de poubelle pour supprimer -->
            <button onclick="deleteGame(${game.id})">
                <i class="fas fa-trash-alt"></i> <!-- Poubelle -->
            </button>
        </div>
    `;
    gameList.appendChild(div);
}

// Fonction pour démarrer la minuterie de chaque partie
function startGameTimer(game) {
    const gameElement = document.getElementById(`game-${game.id}`);
    const timerElement = gameElement.querySelector(`#timer-${game.id}`);
    
    let remainingTime = gameTimers[game.id] || 0; // Initialise avec le temps enregistré ou 0

    const updateTimer = () => {
        if (remainingTime >= 300) {
            finishGame(game.id);
            return;
        }

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        remainingTime++;
        gameTimers[game.id] = remainingTime; // Mise à jour du temps stocké
    };

    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Initialiser immédiatement

    // Stocke l'intervalle pour pouvoir l'arrêter si nécessaire
    gameTimers[game.id].interval = timerInterval;
}


// Terminer une partie
async function finishGame(id) {
    try {
        await fetch(`/api/games/${id}`, {
            method: 'PATCH',
        });
        const game = document.getElementById(`game-${id}`);
        
        // Vérifier si la partie est déjà terminée (pour éviter d'ajouter "Terminé" plusieurs fois)
        const gameSpan = game.querySelector('span');
        if (!gameSpan.textContent.includes('Terminé')) {
            gameSpan.textContent += '';
        }

        game.classList.add('finished');
        updateCounter(); // Mettre à jour le compteur après la fin de la partie
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
        document.getElementById(`game-${id}`).remove();
        updateCounter(); // Mettre à jour le compteur après suppression
    } catch (err) {
        console.error('Erreur lors de la suppression de la partie:', err);
    }
}

// Mettre à jour le compteur des parties non terminées
function updateCounter() {
    const ongoingGames = document.querySelectorAll('.game:not(.finished)').length;
    ongoingCounter.textContent = `${ongoingGames} parties en cours`; // Mise à jour du texte du compteur
}