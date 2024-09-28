// Récupérer le canvas et le contexte
const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

// Dimensions de la raquette et de la balle
const paddleWidth = 10, paddleHeight = 100;
const ballRadius = 10;

// Position et vitesse initiales des raquettes et de la balle
let player1Y = (canvas.height - paddleHeight) / 2;
let player2Y = (canvas.height - paddleHeight) / 2;
let playerSpeed = 6;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 5, ballSpeedY = 5;

// Contrôles des joueurs
let upPressed = false, downPressed = false;
let wPressed = false, sPressed = false;

// Dessiner les raquettes
function drawPaddle(x, y) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

// Dessiner la balle
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
}

// Dessiner le terrain (ligne au centre)
function drawNet() {
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = "#fff";
    ctx.stroke();
}

// Gérer le déplacement des raquettes
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

// Gérer les collisions avec les raquettes
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

// Gérer les collisions avec les murs
function ballWallCollision() {
    if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
        ballSpeedY = -ballSpeedY;
    }
    if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) {
        // Remet la balle au centre après avoir atteint un mur
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
    }
}

// Gérer le mouvement de la balle
function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;
}

// Mettre à jour le canvas
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Effacer le canvas
    drawNet();
    drawPaddle(0, player1Y);                           // Raquette gauche (joueur 1)
    drawPaddle(canvas.width - paddleWidth, player2Y);  // Raquette droite (joueur 2)
    drawBall();

    movePaddles();
    moveBall();
    ballPaddleCollision();
    ballWallCollision();

    requestAnimationFrame(update);
}

// Gérer les événements de clavier
document.addEventListener("keydown", function(e) {
    if (e.key == "ArrowUp") {
        upPressed = true;
    } else if (e.key == "ArrowDown") {
        downPressed = true;
    }
    if (e.key == "w") {
        wPressed = true;
    } else if (e.key == "s") {
        sPressed = true;
    }
});

document.addEventListener("keyup", function(e) {
    if (e.key == "ArrowUp") {
        upPressed = false;
    } else if (e.key == "ArrowDown") {
        downPressed = false;
    }
    if (e.key == "w") {
        wPressed = false;
    } else if (e.key == "s") {
        sPressed = false;
    }
});

// Lancer le jeu
update();