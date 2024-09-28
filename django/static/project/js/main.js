document.addEventListener('DOMContentLoaded', function () {
    const content = document.querySelector('main');  // Select the main content area

    // Function to load the Pong game view
    function loadPongGame(room_name) {
        // Replace the current content with the Pong game interface
        content.innerHTML = `
            <h1>Pong Game - Room: ${room_name}</h1>
            <canvas id="pong" width="800" height="600"></canvas>
        `;

        // Dynamically load the pong.js script to initialize the game
        const script = document.createElement('script');
        script.src = '/static/pong/js/pong.js';  // Ensure the path to pong.js is correct
        document.body.appendChild(script);
    }

    // Function to create a new game and fetch the room_name from the API
    function createGame() {
        fetch('/api/create/')  // Make a request to the API to create a game
            .then(response => response.json())  // Parse the response as JSON
            .then(data => {
                // Call the function to load the Pong game with the room name
                loadPongGame(data.room_name);
            })
            .catch(error => {
                console.error('Error creating game:', error);
            });
    }

    // Set up the event listener for the "Start Playing" button
    document.querySelector('.play-btn').addEventListener('click', function (e) {
        e.preventDefault();  // Prevent the default link behavior
        createGame();  // Call the function to create the game
    });
});
