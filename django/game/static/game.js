const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
document.getElementById('scene-box').style.display = 'none';

// Paddle and ball dimensions
const paddleWidth = 10, paddleHeight = 100;
const ballRadius = 10;

// Initial positions and speeds
let player1Y = (canvas.height - paddleHeight) / 2;
let player2Y = (canvas.height - paddleHeight) / 2;
const playerSpeed = 6;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 5, ballSpeedY = 5;

// Connexion au WebSocket
const socket = new WebSocket('ws://' + window.location.host + '/ws/pong/' + party_id + '/');

let userId = null;
socket.onmessage = function(event) {
	const data = JSON.parse(event.data);

	if (data.user_id && userId === null) {
		userId = data.user_id;  // Stocker le channel_name du client
		console.log(`Votre ID est : ${userId}`);
	}

	if (data.start_game) {
		document.getElementById('waiting-room').style.display = 'none';
		document.getElementById('game').style.display = 'block';
	}

	// Gérer les actions (par exemple les mouvements de raquette)
	if (data.action) {
		console.log(`ID : ${data.user_id}, action: ${data.action}`);
	}

};

// Exemple d'envoi d'une action lorsque l'utilisateur appuie sur une touche
document.addEventListener('keydown', function(event) {
	if (event.key === 'ArrowUp') {
		socket.send(JSON.stringify({
			'action': 'move_paddle_up',
			'user_id': userId
		}));
	} else if (event.key === 'ArrowDown') {
		socket.send(JSON.stringify({
			'action': 'move_paddle_down',
			'user_id': userId
		}));
	}
});