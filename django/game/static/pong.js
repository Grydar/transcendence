// Get the canvas and context
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Paddle and ball dimensions
const paddleWidth = 10, paddleHeight = 100;
const ballRadius = 10;

// Initial positions and speeds
let player1Y = (canvas.height - paddleHeight) / 2;
let player2Y = (canvas.height - paddleHeight) / 2;
const playerSpeed = 6;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 5, ballSpeedY = 5;

// Player scores
let player1Score = 0;
let player2Score = 0;
const winningScore = 11;

// Player controls
let upPressed = false, downPressed = false;
let wPressed = false, sPressed = false;

// Game state
let gameOver = false;

// Draw paddles
function drawPaddle(x, y) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

// Draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
}

// Draw the net
function drawNet() {
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = "#fff";
    ctx.stroke();
}

// Draw the score
function drawScore() {
    ctx.font = "32px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(player1Score, canvas.width / 4, 50);
    ctx.fillText(player2Score, 3 * canvas.width / 4, 50);
}

// Draw the winner message
function drawWinner(winner) {
    ctx.font = "48px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(winner + " a gagné !", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText("Appuyez sur R pour rejouer", canvas.width / 2, canvas.height / 2 + 30);
}

// Move paddles
function movePaddles() {
    if (wPressed && player1Y > 0) {
        player1Y -= playerSpeed;
    }
    if (sPressed && player1Y < canvas.height - paddleHeight) {
        player1Y += playerSpeed;
    }
    if (upPressed && player2Y > 0) {
        player2Y -= playerSpeed;
    }
    if (downPressed && player2Y < canvas.height - paddleHeight) {
        player2Y += playerSpeed;
    }
}

// Ball and paddle collision
function ballPaddleCollision() {
    if (ballX - ballRadius < paddleWidth) {
        if (ballY > player1Y && ballY < player1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }
    }
    if (ballX + ballRadius > canvas.width - paddleWidth) {
        if (ballY > player2Y && ballY < player2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }
    }
}

// Ball and wall collision
function ballWallCollision() {
    if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
        ballSpeedY = -ballSpeedY;
    }
    if (ballX + ballRadius > canvas.width) {
        // Player 1 scores
        player1Score++;
        resetBall();
        checkWinCondition();
    }
    if (ballX - ballRadius < 0) {
        // Player 2 scores
        player2Score++;
        resetBall();
        checkWinCondition();
    }
}

// Reset the ball to the center
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 5 * (Math.random() > 0.5 ? 1 : -1);
}

// Check if a player has won
function checkWinCondition() {
    if (player1Score >= winningScore) {
        gameOver = true;
        drawWinner("Joueur 1");
        submitResult("Joueur 1");
    } else if (player2Score >= winningScore) {
        gameOver = true;
        drawWinner("Joueur 2");
        submitResult("Joueur 2");
    }
}

// Move the ball
function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;
}

// Update the canvas
function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawPaddle(0, player1Y);
    drawPaddle(canvas.width - paddleWidth, player2Y);
    drawBall();

    movePaddles();
    moveBall();
    ballPaddleCollision();
    ballWallCollision();
    drawScore();

    requestAnimationFrame(update);
}

// Handle keyboard events
document.addEventListener("keydown", function(e) {
    if (e.key == "ArrowUp") {
        upPressed = true;
    } else if (e.key == "ArrowDown") {
        downPressed = true;
    }
    if (e.key == "w" || e.key == "W") {
        wPressed = true;
    } else if (e.key == "s" || e.key == "S") {
        sPressed = true;
    }
    // Restart the game after victory by pressing R
    if (e.key == "r" || e.key == "R") {
        if (gameOver) resetGame();
    }
});

document.addEventListener("keyup", function(e) {
    if (e.key == "ArrowUp") {
        upPressed = false;
    } else if (e.key == "ArrowDown") {
        downPressed = false;
    }
    if (e.key == "w" || e.key == "W") {
        wPressed = false;
    } else if (e.key == "s" || e.key == "S") {
        sPressed = false;
    }
});

// Reset the game after victory
function resetGame() {
    player1Score = 0;
    player2Score = 0;
    gameOver = false;
    resetBall();
    update();
}

// Submit game result to the server
function submitResult(winner) {
    const data = {
        party_id: party_id,
        player_score: player1Score,
        opponent_score: player2Score
    };
    
    fetch(submitResultUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log("Game result submitted successfully.");
        } else {
            console.error("Error submitting game result:", data);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Function to get CSRF token from cookies
function getCSRFToken() {
    let cookieValue = null;
    const name = 'csrftoken';
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Start the game
update();
