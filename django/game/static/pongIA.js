// static/pong.js

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
let socketUrl = protocol + '://' + window.location.host + '/ws/pong/' + party_id + '/';
console.log(`WebSocket URL: ${socketUrl}`);

const socket = new WebSocket(socketUrl);

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
// test
let ballSpeedX = 5;
let ballSpeedY = 3;
// fin test

let upPressed = false;
let downPressed = false;

let gameStarted = false;

//test
let score1 = 0;
let score2 = 0;
// fin test

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

//test
function startGame() {
    document.getElementById('waiting-room').style.display = 'none'; // Hide waiting room
    document.getElementById('game-container').style.display = 'block'; // Show game

    gameStarted = true;
    requestAnimationFrame(draw); // Start the game loop
}

function moveAI() {
    
    if (ballY > paddle2Y + paddleHeight / 2) {
        paddle2Y += 5; // Move AI paddle down
    } else if (ballY < paddle2Y + paddleHeight / 2) {
        paddle2Y -= 5; // Move AI paddle up
    }

    // Prevent AI paddle from going off the screen
    if (paddle2Y < 0) paddle2Y = 0;
    if (paddle2Y + paddleHeight > canvas.height) paddle2Y = canvas.height - paddleHeight;
}
//fin test

// WebSocket event handlers - Démarre le jeu
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
        // Optionally redirect or reset the game
        setTimeout(function() {
            if (match_id) {
                window.location.href = '/game/tournaments/'+ tournament_id + '/progress/';
                return;
            }
            else {
                window.location.href = '/game/lobby/';
            }
        }, 3000);
    }
};

function updateScoreBoard() {
    document.getElementById('leftScore').textContent = `Player: ${score1}`;
    document.getElementById('rightScore').textContent = `AI: ${score2}`;
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

    //test
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    //fin test

    //test
     // Ball collision with top and bottom walls
     if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
        ballSpeedY = -ballSpeedY;
    }

    // Ball collision with player paddle
    if (ballX - ballRadius < paddleWidth && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
    }

    // Ball collision with AI paddle
    if (ballX + ballRadius > canvas.width - paddleWidth && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
    }

    // Ball goes off screen (left or right)
    if (ballX - ballRadius < 0) {
        score2++; // AI scores
        resetBall();
    }
    if (ballX + ballRadius > canvas.width) {
        score1++; // Player scores
        resetBall();
    }

    // Update the score
    updateScoreBoard();
    //fin test

    //test
     // Move player paddle based on key presses
     if (upPressed && paddle1Y > 0) {
        paddle1Y -= 7;
    } else if (downPressed && paddle1Y + paddleHeight < canvas.height) {
        paddle1Y += 7;
    }

    // Move the AI paddle
    moveAI();
    //fin test

	requestAnimationFrame(draw);
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX; // Change direction
    ballSpeedY = (Math.random() > 0.5 ? 3 : -3); // Randomize the Y direction
}

// WebSocket event handlers (minimal, since there's no waiting)
socket.onopen = function() {
    console.log('WebSocket connection opened');
    startGame(); // Start the game immediately
};

socket.onclose = function() {
    console.log('WebSocket connection closed');
};