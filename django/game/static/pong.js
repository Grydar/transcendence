// static/pong.js

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
let socketUrl = protocol + '://' + window.location.host + '/ws/pong/' + party_id + '/';
console.log(`WebSocket URL: ${socketUrl}`);

if (match_id) {
    socketUrl += `${match_id}/`;
}
console.log(`WebSocket URL: ${socketUrl}`);
const socket = new WebSocket(socketUrl);

let userId = null;
let isPlayerOne = false;

let playerOneUsername = '';
let playerTwoUsername = '';

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

const leftScoreSpan = document.createElement('span');
leftScoreSpan.id = 'leftScore';
const rightScoreSpan = document.createElement('span');
rightScoreSpan.id = 'rightScore';
scoreBoard.appendChild(leftScoreSpan);
scoreBoard.appendChild(rightScoreSpan);
leftScoreSpan.style.float = 'left';
rightScoreSpan.style.float = 'right';

scoreBoard.style.color = 'white';
scoreBoard.style.fontSize = '24px';
scoreBoard.style.textAlign = 'center';
scoreBoard.style.marginBottom = '10px';
document.getElementById('game-container').insertBefore(scoreBoard, canvas);

let score1 = 0;
let score2 = 0;

// Game/User stats
let player1BallHits = 0;
let player2BallHits = 0;
let winner = null;
let matchStartTime = null;
// let matchEndTime = null;
// matchEndTime = Date.now();
let matchDuration = null;

// Function to get CSRF token from meta tag
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// Sends statistics to backend for user/game stats module
function endGame(data)
{
	winner = data.winner;
	matchDuration = (Date.now() - matchStartTime) / 1000;

	const url = window.location.href;
	const parts = url.split('/');
	const match_id = parts[4];

	// alert('url: ' + url);
	// alert('match id: ' + match_id);
	
	let gameData = {
		'player1BallHits': player1BallHits,
		'player2BallHits': player2BallHits,
		'totalBallHits': player1BallHits + player2BallHits,
		'winner': winner,
		'matchDuration': matchDuration,
		'player1Score': score1,
		'player2Score': score2,
		'match_id': match_id,
	};

    //HTTP request to send new data to db
	fetch('submit_stats/',
	{
		method: 'POST',
		headers:
		{
			'Content-Type': 'application/json',
			'X-CSRFToken': getCSRFToken()
		},
		body: JSON.stringify(gameData)
	})
	.then(response => response.json())
	.then(data =>
	{
		// const match_id = data.match_id;
		window.location.href = `/game/${match_id}/stats/`;
		console.log('Game data submitted successfully');
	})
	.catch((error) => 
	{
		console.error('Error:', error);
	});
}

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

function startCountdown(duration) {
    let countdownTime = duration;

    function updateCountdown() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Display the countdown number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (countdownTime > 0) {
            ctx.fillText(countdownTime, canvas.width / 2, canvas.height / 2);
            countdownTime--;
            setTimeout(updateCountdown, 1000);
        } else {
            ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
            // Wait a moment before starting the game to show 'GO!'
            setTimeout(function() {
                gameStarted = true;
				matchStartTime = Date.now();
                requestAnimationFrame(draw);
            }, 500);
        }
    }

    updateCountdown();
}

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.action === 'set_user_id') {
        userId = parseInt(data.user_id);
        console.log(`Your user ID is: ${userId}`);
    }

    if (data.action === 'start_game') {
        gameStarted = false;
        document.getElementById('waiting-room').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        const playerIds = data.player_ids.map(id => parseInt(id));
        const playerUsernames = data.player_usernames;

        // Determine player role
        if (userId === playerIds[0]) {
            isPlayerOne = true;
        } else if (userId === playerIds[1]) {
            isPlayerOne = false;
        } else {
            console.error('User ID does not match any player ID');
        }

        playerOneUsername = playerUsernames[playerIds[0]];
        playerTwoUsername = playerUsernames[playerIds[1]];

        const countdownDuration = data.countdown_duration || 3;
        startCountdown(countdownDuration);
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
        score1 = data.score1;
        score2 = data.score2;
        updateScoreBoard();
        gameStarted = false;

        const canvas = document.getElementById('gameCanvas');
        const gameoverMessage = document.getElementById('gameover-message');
    
        // Get canvas position relative to its parent
        const canvasRect = canvas.getBoundingClientRect();
        const parentRect = canvas.parentElement.getBoundingClientRect();
    
        // Calculate the position of the canvas relative to its parent
        const topPosition = canvas.offsetTop;
        const leftPosition = canvas.offsetLeft;
    
        // Apply styles to position the gameover message over the canvas
        gameoverMessage.style.position = 'absolute';
        gameoverMessage.style.top = topPosition + 'px';
        gameoverMessage.style.left = leftPosition + 'px';
        gameoverMessage.style.width = canvas.width - 44 + 'px';
        gameoverMessage.style.height = canvas.height  - 32 + 'px';
        gameoverMessage.style.display = 'flex';
    
        document.getElementById('gameover-text').textContent = data.message + ' Redirecting to lobby...';
        
		endGame(data);
		
		// Optionally redirect or reset the game
        setTimeout(function() {
            if (match_id) {
                window.location.href = '/game/tournaments/'+ tournament_id + '/progress/';
                return;
            }
            // else {
            //     window.location.href = '/game/lobby/';
            // }
        }, 3000);
    }
};

function updateScoreBoard() {
    let leftUsername, leftScore, rightUsername, rightScore;

    leftUsername = playerOneUsername;
    leftScore = score1;
    rightUsername = playerTwoUsername;
    rightScore = score2;

    document.getElementById('leftScore').textContent = `${leftUsername}: ${leftScore}`;
    document.getElementById('rightScore').textContent = `${rightUsername}: ${rightScore}`;
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

	if (ballX == paddleWidth && ballY >= paddle1Y && ballY <= paddle1Y + paddleHeight) //collision with left paddle happened
		player1BallHits++;
	else if (ballX == paddleWidth && ballY >= paddle2Y && ballY <= paddle2Y + paddleHeight) //collision with right paddle happened
		player2BallHits++;

	requestAnimationFrame(draw);
}
