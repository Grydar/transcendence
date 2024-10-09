// static/pong.js

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socketUrl = protocol + '://' + window.location.host + '/ws/pong/' + party_id + '/';
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
            window.location.href = '/game/lobby/';
        }, 4000);
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

	requestAnimationFrame(draw);
}


/*AI stuff*/

class position {
	constructor(ball_x, ball_y, bot_paddle_y) {
		this.ball_x = ballX;
		this.ball_y = ballY;
		this.bot_paddle_y = player2Y;
	}
}

let prevBallPos;

function calcBallDirection(ballPos)
{
	let direction = new position(ballPos.ball_x, ballPos.ball_y, null);
	if (prevBallPos)
	{
		direction.ball_x = ballPos.ball_x - prevBallPos.ball_x;
		direction.ball_y = ballPos.ball_y - prevBallPos.ball_y;
	}
	prevBallPos = ballPos;
	return (direction);
}

//Returns list of points that the ball will be before hitting AI player's wall
function calcBallTrajectory(direction)
{
	let trajectory = [];
	for (let i = 0; direction.ball_x < canvas.width && i < 10000; i++)
	{
		if (direction.ball_y + ballSpeedY > canvas.height || direction.ball_y - ballSpeedY < 0)
			direction.ball_y = -direction.ball_y;
		trajectory.push(new position(direction.ball_x, direction.ball_y, null));
		direction.ball_x += ballSpeedX;
		direction.ball_y += ballSpeedY;
	}
	return (trajectory);
}

function simulateKeyPress(which)
{
	var keyboardEvent = document.createEvent('KeyboardEvent');
	var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? 'initKeyboardEvent' : 'initKeyEvent';
    
	if (which == "keydown")
	{
		keyboardEvent[initMethod](
			'keydown', // event type: keydown, keyup, keypress
			true, // bubbles
			true, // cancelable
			window, // view: should be window
			false, // ctrlKey
			false, // altKey
			false, // shiftKey
			false, // metaKey
			40, // keyCode: unsigned long - the virtual key code, else 0
			0, // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
		);
	}
	else
	{
		keyboardEvent[initMethod](
			'keyup', // event type: keydown, keyup, keypress
			true, // bubbles
			true, // cancelable
			window, // view: should be window
			false, // ctrlKey
			false, // altKey
			false, // shiftKey
			false, // metaKey
			40, // keyCode: unsigned long - the virtual key code, else 0
			0, // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
		);
	}
	document.dispatchEvent(keyboardEvent);
}

function minimax(currentPosition, ballTrajectory)
{
	if (gameOver)
		return ;

	//Can we still hit the ball if we don't move the paddle?
	for (let i = 0; i < ballTrajectory.length; i++)
	{
		if (currentPosition.bot_paddle_y == ballTrajectory[i].ball_y) //we should check x as well somehow
			return ;
	}
	for (let i = playerSpeed; currentPosition.bot_paddle_y + i < canvas.height && currentPosition.bot_paddle_y + i > 0; i += playerSpeed)
	{
		for (let k = 0; k < ballTrajectory.length; k++)
		{
			if (currentPosition.bot_paddle_y + i == ballTrajectory[k].ball_y)
				return (simulateKeyPress("keydown"));
		}
	}
	for (let i = playerSpeed; currentPosition.bot_paddle_y - i > 0; i -= playerSpeed)
	{
		for (let k = 0; k < ballTrajectory.length; k++)
		{
			if (currentPosition.bot_paddle_y - i == ballTrajectory[k].ball_y)
				return (simulateKeyPress("keyup"));
		}
	}
}

// Start the game
// update();