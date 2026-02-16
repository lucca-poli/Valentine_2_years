// Game state
/** @type {number} */
let currentScene = 0;
/** @type {boolean} */
let gameActive = false;


// Game variables
/** @type {{x: number, y: number, width: number, height: number, velocity: number, gravity: number, jumpPower: number}} */
let player = {
    x: 100,
    y: 200,
    width: 80,
    height: 80,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -10
};

/** @type {Array<{x: number, topHeight: number, bottomY: number, bottomHeight: number, width: number, passed: boolean}>} */
let obstacles = [];
/** @type {number} */
let distance = 0;
/** @type {number} */
let obstacleSpeed = 3;
/** @type {boolean} */
let isSpacePressed = false;

// Canvas setup
/** @type {HTMLCanvasElement | null} */
const canvas = document.getElementById('game-canvas');
/** @type {CanvasRenderingContext2D | null} */
const ctx = canvas ? canvas.getContext('2d') : null;

function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

/** @type {HTMLElement[]} */
const scenes = [
    'intro-scene',
    'game-scene',
    'arrival-scene',
    'kissing-scene',
    'question-scene',
    'final-scene'
];

const backgrounds = {
    'intro-scene': 'images/background_scene.jpg',
}

function switchScene(sceneIndex) {
    scenes.forEach((sceneId, index) => {
        const scene = document.getElementById(sceneId);
        if (scene) {
            scene.classList.toggle('active', index === sceneIndex);
        }
    });

    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer && backgrounds[sceneIndex]) {
        sceneContainer.style.backgroundImage = `url('${backgrounds[sceneIndex]}')`;
        sceneContainer.style.backgroundSize = 'cover';
        sceneContainer.style.backgroundPosition = 'center';
    }

    currentScene = sceneIndex;
}

function startIntroAnimation() {
    const you = document.getElementById('you-intro');
    const airplane = document.getElementById('airplane-intro');

    if (!you || !airplane) return;

    let position = 0;
    let jumpHeight = 30; // Height of each jump
    let interval = 350; // Time between each jump
    const dislocation = 10;

    function jump() {
        if (position >= 45) { // Target horizontal position
            // Once the "you" element reaches the airplane, finalize the animation
            you.style.transition = 'all 1s ease-in-out';
            you.style.opacity = '0';
            you.style.transform = 'scale(0.5)';
            setTimeout(() => {
                switchScene(1);
                startGame();
            }, 1500);
            return;
        }

        // Jump up and move forward
        you.style.transition = 'all 0.2s ease-in-out';
        you.style.left = `${position + dislocation}%`;
        you.style.bottom = `${22 + jumpHeight}%`;

        setTimeout(() => {
            // Fall down to ground level
            you.style.bottom = '22%';
        }, interval / 2);

        position += dislocation;
        setTimeout(jump, interval);
    }

    setTimeout(jump, 500); // Start jumping after a short delay
}

function startGame() {
    if (!canvas || !ctx) return;

    gameActive = true;
    console.log("height is ", canvas.height);
    player.y = canvas.height / 2;
    player.velocity = 0;
    obstacles = [];
    distance = 0;
    createObstacle();
    gameLoop();
}

function createObstacle() {
    const gap = 250;
    const minHeight = 100;
    const maxHeight = canvas.height - gap - minHeight;
    const height = Math.random() * maxHeight + minHeight;

    obstacles.push({
        x: canvas.width,
        topHeight: height,
        bottomY: height + gap,
        bottomHeight: canvas.height - (height + gap),
        width: 80,
        passed: false
    });
}

function updateGame() {
    if (!gameActive) return;

    if (isSpacePressed) {
        player.velocity = player.jumpPower;
    } else {
        player.velocity += player.gravity;
    }

    player.y += player.velocity;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;

    obstacles.forEach(obstacle => {
        obstacle.x -= obstacleSpeed;

        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            distance += 10;
            document.getElementById('score').textContent = `Distance: ${distance}m`;
        }
    });

    obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);

    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 400) {
        createObstacle();
    }

    checkCollisions();
    if (distance >= 500) {
        winGame();
    }
}

function checkCollisions() {
    obstacles.forEach(obstacle => {
        if (player.x + player.width > obstacle.x &&
            player.x < obstacle.x + obstacle.width &&
            player.y < obstacle.topHeight) {
            gameOver();
        }

        if (player.x + player.width > obstacle.x &&
            player.x < obstacle.x + obstacle.width &&
            player.y + player.height > obstacle.bottomY) {
            gameOver();
        }
    });
}

// Load player image
const playerImage = new Image();
playerImage.src = 'images/airplane_moving_flipped.png';

function drawGame() {
    if (!ctx || !canvas) return;

    // Clear canvas - sky blue background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player image
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    // Draw obstacles
    ctx.fillStyle = '#8B4513';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.topHeight);
        ctx.fillRect(obstacle.x, obstacle.bottomY, obstacle.width, obstacle.bottomHeight);
    });
}

function gameLoop() {
    if (!gameActive) return;

    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    alert('Oops! Try again!');
    startGame();
}

function winGame() {
    gameActive = false;
    setTimeout(() => {
        switchScene(2);
        startArrivalAnimation();
    }, 500);
}

function startArrivalAnimation() {
    const you = document.getElementById('you-arrival');
    const girlfriend = document.getElementById('girlfriend');

    if (!you || !girlfriend) return;

    setTimeout(() => {
        you.style.transition = 'all 3s ease-in-out';
        you.style.right = 'auto';
        you.style.left = '45%';
    }, 500);

    setTimeout(() => {
        switchScene(3);
        startKissingAnimation();
    }, 3500);
}

function startKissingAnimation() {
    const cloud = document.getElementById('cloud');
    const heartsContainer = document.getElementById('hearts-container');

    if (!cloud || !heartsContainer) return;

    setTimeout(() => {
        cloud.classList.add('visible');
    }, 1000);

    let heartCount = 0;
    const heartInterval = setInterval(() => {
        if (heartCount >= 15) {
            clearInterval(heartInterval);
            setTimeout(() => {
                switchScene(4);
                setupQuestionScene();
            }, 2000);
            return;
        }

        createHeart(heartsContainer);
        heartCount++;
    }, 300);
}

function createHeart(container) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = '❤️';
    heart.style.left = `${Math.random() * 80 + 10}%`;
    heart.style.top = '60%';
    container.appendChild(heart);
    setTimeout(() => {
        heart.remove();
    }, 3000);
}

function setupQuestionScene() {
    const yesButton = document.getElementById('yes-button');
    const noButton = document.getElementById('no-button');

    if (!yesButton || !noButton) return;

    yesButton.addEventListener('click', () => {
        switchScene(5);
    });

    noButton.addEventListener('mouseenter', moveNoButton);
    noButton.addEventListener('click', moveNoButton);
}

function moveNoButton() {
    const noButton = document.getElementById('no-button');
    if (!noButton) return;

    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 100;

    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;

    noButton.style.position = 'fixed';
    noButton.style.left = `${randomX}px`;
    noButton.style.top = `${randomY}px`;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameActive) {
        e.preventDefault();
        isSpacePressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        isSpacePressed = false;
    }
});

// Start the game
window.addEventListener('load', () => {
    setTimeout(() => {
        startIntroAnimation();
    }, 1000);
});

