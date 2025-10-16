// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración del juego
const TILE_COUNT = 30;
let gridSize = 20;

// Configurar tamaño del canvas
function resizeCanvas() {
    const size = Math.min(window.innerWidth - 40, 500);
    canvas.width = size;
    canvas.height = size;
    gridSize = canvas.width / TILE_COUNT;
}

resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (gameRunning) {
        drawGame();
    }
});

// Variables del juego
let snake = [
    { x: 15, y: 15 },
    { x: 14, y: 15 },
    { x: 13, y: 15 }
];
let food = { x: 20, y: 15 };
let dx = 1;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameLoop;

// Elementos del DOM
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const touchControls = document.querySelectorAll('.control-btn');

// Actualizar puntuación alta
highScoreElement.textContent = highScore;

// Función para generar comida en posición aleatoria
function generateFood() {
    food.x = Math.floor(Math.random() * TILE_COUNT);
    food.y = Math.floor(Math.random() * TILE_COUNT);
    
    // Asegurarse de que la comida no aparezca sobre la serpiente
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
}

// Dibujar el juego
function drawGame() {
    // Limpiar canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar cuadrícula sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Dibujar serpiente
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Cabeza de la serpiente
            const gradient = ctx.createLinearGradient(
                segment.x * gridSize, 
                segment.y * gridSize,
                (segment.x + 1) * gridSize,
                (segment.y + 1) * gridSize
            );
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(1, '#22c55e');
            ctx.fillStyle = gradient;
        } else {
            // Cuerpo de la serpiente
            const opacity = 1 - (index / snake.length) * 0.3;
            ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
        }
        
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
        
        // Ojos en la cabeza
        if (index === 0) {
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            if (dx === 1 || (dx === 0 && dy === 0)) { // Mirando derecha (por defecto)
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + 4, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + gridSize - 7, eyeSize, eyeSize);
            } else if (dx === -1) { // Mirando izquierda
                ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + 4, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + gridSize - 7, eyeSize, eyeSize);
            } else if (dy === 1) { // Mirando abajo
                ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - 7, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (dy === -1) { // Mirando arriba
                ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - 7, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
            }
        }
    });
    
    // Dibujar comida con efecto brillante
    const gradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        0,
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2
    );
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(0.5, '#f59e0b');
    gradient.addColorStop(1, '#d97706');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Actualizar el juego
function update() {
    if (!gameRunning) return;
    
    // Crear nueva cabeza
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Verificar colisión con paredes (con teletransporte)
    if (head.x < 0) head.x = TILE_COUNT - 1;
    if (head.x >= TILE_COUNT) head.x = 0;
    if (head.y < 0) head.y = TILE_COUNT - 1;
    if (head.y >= TILE_COUNT) head.y = 0;
    
    // Verificar colisión con el cuerpo
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            endGame();
            return;
        }
    }
    
    // Agregar nueva cabeza
    snake.unshift(head);
    
    // Verificar si comió la comida
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
        
        // Actualizar récord
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            highScoreElement.textContent = highScore;
        }
    } else {
        // Remover cola si no comió
        snake.pop();
    }
    
    drawGame();
}

// Iniciar el juego
function startGame() {
    snake = [
        { x: 15, y: 15 },
        { x: 14, y: 15 },
        { x: 13, y: 15 }
    ];
    dx = 1; // Comenzar moviéndose hacia la derecha
    dy = 0;
    lastDirection = { dx: 1, dy: 0 };
    score = 0;
    scoreElement.textContent = score;
    generateFood();
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
    drawGame();
}

// Terminar el juego
function endGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Controles de teclado
let lastDirection = { dx: 1, dy: 0 };

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    // Prevenir el cambio de dirección en 180 grados
    switch (e.key) {
        case 'ArrowUp':
            if (lastDirection.dy !== 1) {
                dx = 0;
                dy = -1;
            }
            e.preventDefault();
            break;
        case 'ArrowDown':
            if (lastDirection.dy !== -1) {
                dx = 0;
                dy = 1;
            }
            e.preventDefault();
            break;
        case 'ArrowLeft':
            if (lastDirection.dx !== 1) {
                dx = -1;
                dy = 0;
            }
            e.preventDefault();
            break;
        case 'ArrowRight':
            if (lastDirection.dx !== -1) {
                dx = 1;
                dy = 0;
            }
            e.preventDefault();
            break;
    }
    
    lastDirection = { dx, dy };
});

// Controles táctiles
touchControls.forEach(button => {
    button.addEventListener('click', (e) => {
        if (!gameRunning) return;
        
        const direction = e.target.dataset.direction;
        
        switch (direction) {
            case 'up':
                if (lastDirection.dy !== 1) {
                    dx = 0;
                    dy = -1;
                }
                break;
            case 'down':
                if (lastDirection.dy !== -1) {
                    dx = 0;
                    dy = 1;
                }
                break;
            case 'left':
                if (lastDirection.dx !== 1) {
                    dx = -1;
                    dy = 0;
                }
                break;
            case 'right':
                if (lastDirection.dx !== -1) {
                    dx = 1;
                    dy = 0;
                }
                break;
        }
        
        lastDirection = { dx, dy };
    });
});

// Prevenir el desplazamiento de la página con las flechas
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

// Eventos de botones
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Controles táctiles en el canvas
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('click', handleCanvasClick);

function handleTouchStart(e) {
    if (!gameRunning) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    changeDirectionBasedOnTouch(touchX, touchY);
}

function handleCanvasClick(e) {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    changeDirectionBasedOnTouch(clickX, clickY);
}

function changeDirectionBasedOnTouch(touchX, touchY) {
    // Obtener posición de la cabeza de la serpiente en píxeles
    const headX = snake[0].x * gridSize + gridSize / 2;
    const headY = snake[0].y * gridSize + gridSize / 2;
    
    // Calcular diferencias
    const diffX = touchX - headX;
    const diffY = touchY - headY;
    
    // Determinar dirección basada en la diferencia mayor
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Movimiento horizontal
        if (diffX > 0 && lastDirection.dx !== -1) {
            // Tocar a la derecha
            dx = 1;
            dy = 0;
        } else if (diffX < 0 && lastDirection.dx !== 1) {
            // Tocar a la izquierda
            dx = -1;
            dy = 0;
        }
    } else {
        // Movimiento vertical
        if (diffY > 0 && lastDirection.dy !== -1) {
            // Tocar abajo
            dx = 0;
            dy = 1;
        } else if (diffY < 0 && lastDirection.dy !== 1) {
            // Tocar arriba
            dx = 0;
            dy = -1;
        }
    }
    
    lastDirection = { dx, dy };
}

// Dibujar pantalla inicial
drawGame();

