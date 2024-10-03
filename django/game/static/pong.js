// static/pong.js

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socketUrl = protocol + '://' + window.location.host + '/ws/pong/' + party_id + '/';
const socket = new WebSocket(socketUrl);

let userId = null;
let isPlayerOne = false;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const paddleWidth = 10;
const paddleHeight = 100;
const ballRadius = 10;

let paddle1Y = (canvas.height - paddleHeight) / 2;
let paddle2Y = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;

let upPressed = false;
let downPressed = false;

let gameStarted = false;

const scoreBoard = document.createElement('div');
scoreBoard.id = 'scoreBoard';
scoreBoard.style.color = 'white';
scoreBoard.style.fontSize = '24px';
scoreBoard.style.textAlign = 'center';
scoreBoard.style.marginBottom = '10px';
document.getElementById('game-container').insertBefore(scoreBoard, canvas);

let score1 = 0;
let score2 = 0;

// Event listeners for key presses
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

function keyDownHandler(e) {
    if (e.key === 'ArrowUp') {
        upPressed = true;
    } else if (e.key === 'ArrowDown') {
        downPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowUp') {
        upPressed = false;
    } else if (e.key === 'ArrowDown') {
        downPressed = false;
    }
}

// WebSocket event handlers
socket.onopen = function() {
    console.log('WebSocket connection opened');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.action === 'set_user_id') {
        userId = parseInt(data.user_id);  // Ensure userId is an integer
        console.log(`Your user ID is: ${userId}`);
    }

    if (data.action === 'start_game') {
        gameStarted = true;
        document.getElementById('waiting-room').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        // Ensure IDs are integers
        const playerOneId = parseInt(data.player_one_id);
        const playerTwoId = parseInt(data.player_two_id);

        // Determine if this player is player one or two
        if (userId === playerOneId) {
            isPlayerOne = true;
        } else if (userId === playerTwoId) {
            isPlayerOne = false;
        } else {
            console.error('User ID does not match any player ID');
        }

        requestAnimationFrame(draw);
    }

    if (data.action === 'update_state') {
        // Update game state based on data from server
        paddle1Y = data.paddle1Y;
        paddle2Y = data.paddle2Y;
        ballX = data.ballX;
        ballY = data.ballY;
        score1 = data.score1;
        score2 = data.score2;

        // Update the score display
        updateScoreBoard();
    }

    if (data.action === 'game_over') {
        alert(data.message);
        gameStarted = false;
        // Optionally redirect or reset the game
    }
};

function updateScoreBoard() {
    let playerScore = isPlayerOne ? score1 : score2;
    let opponentScore = isPlayerOne ? score2 : score1;
    scoreBoard.textContent = `You: ${playerScore} - Opponent: ${opponentScore}`;
}

socket.onclose = function() {
    console.log('WebSocket connection closed');
};

// Send paddle movement to server
function sendPaddlePosition() {
    if (!gameStarted) return;

    let paddleY = isPlayerOne ? paddle1Y : paddle2Y;

    socket.send(JSON.stringify({
        'action': 'move_paddle',
        'paddleY': paddleY
    }));
}

// Draw function
function draw() {
	if (!gameStarted) return;

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw paddles
	ctx.fillStyle = '#FFFFFF';

	// Paddle 1
	ctx.fillRect(0, paddle1Y, paddleWidth, paddleHeight);

	// Paddle 2
	ctx.fillRect(canvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

	// Draw ball
	ctx.beginPath();
	ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
	ctx.fillStyle = '#FFFFFF';
	ctx.fill();
	ctx.closePath();

	// Draw borders
	ctx.strokeStyle = '#FFFFFF';
	ctx.lineWidth = 2;
	ctx.strokeRect(0, 0, canvas.width, canvas.height);

	// Move paddles based on key presses
	if (upPressed) {
		if (isPlayerOne) {
			paddle1Y -= 7;
			if (paddle1Y < 0) paddle1Y = 0;
		} else {
			paddle2Y -= 7;
			if (paddle2Y < 0) paddle2Y = 0;
		}
		sendPaddlePosition();
	}
	if (downPressed) {
		if (isPlayerOne) {
			paddle1Y += 7;
			if (paddle1Y + paddleHeight > canvas.height) paddle1Y = canvas.height - paddleHeight;
		} else {
			paddle2Y += 7;
			if (paddle2Y + paddleHeight > canvas.height) paddle2Y = canvas.height - paddleHeight;
		}
		sendPaddlePosition();
	}

	requestAnimationFrame(draw);
}
