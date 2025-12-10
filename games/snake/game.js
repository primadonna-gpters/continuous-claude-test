// Sound effects manager using Web Audio API
class SoundManager {
    constructor() {
        this.enabled = this.loadSoundPreference();
        this.audioContext = null;
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    loadSoundPreference() {
        const saved = localStorage.getItem('snake-sound');
        return saved !== 'false';
    }

    saveSoundPreference() {
        localStorage.setItem('snake-sound', this.enabled.toString());
    }

    toggle() {
        this.enabled = !this.enabled;
        this.saveSoundPreference();
        return this.enabled;
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled) return;
        this.initAudioContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playEat() {
        this.playTone(587, 0.1, 'sine', 0.25); // D5
        setTimeout(() => this.playTone(784, 0.1, 'sine', 0.2), 50); // G5
    }

    playMove() {
        this.playTone(220, 0.03, 'square', 0.05);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [392, 349, 330, 262]; // G4, F4, E4, C4 (descending)
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.2), i * 150);
        });
    }

    playStart() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [262, 330, 392]; // C4, E4, G4
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 80);
        });
    }
}

class SnakeGame {
    constructor(soundManager) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.soundManager = soundManager;

        this.gridSize = 20;
        this.tileCount = 20;

        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameSpeed = 100;
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isStarted = false;

        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');
        this.startMessage = document.getElementById('start-message');
        this.messageText = this.gameMessage.querySelector('p');
        this.newGameButton = document.getElementById('new-game-btn');
        this.retryButton = document.getElementById('retry-btn');
        this.pauseButton = document.getElementById('pause-btn');

        this.resizeCanvas();
        this.bindEvents();
        this.updateBestScoreDisplay();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = container.clientWidth;
        this.canvas.width = size;
        this.canvas.height = size;
        this.gridSize = size / this.tileCount;

        if (this.isStarted) {
            this.draw();
        }
    }

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.retryButton.addEventListener('click', () => this.startNewGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());

        // Touch events for swipe
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: true });

        // Click/tap to start
        this.canvas.addEventListener('click', () => {
            if (!this.isStarted) {
                this.startNewGame();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isStarted) {
                e.preventDefault();
                this.startNewGame();
            }
        });

        // Mobile controls
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const dir = btn.dataset.direction;
                this.setDirection(dir);
            });
        });

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    handleKeyDown(event) {
        if (!this.isRunning) return;

        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };

        const dir = keyMap[event.key];
        if (dir) {
            event.preventDefault();
            this.setDirection(dir);
        }

        if (event.code === 'Space') {
            event.preventDefault();
            this.togglePause();
        }
    }

    setDirection(dir) {
        const directions = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };

        const newDir = directions[dir];
        if (!newDir) return;

        // Prevent reverse direction
        if (this.direction.x !== 0 && newDir.x === -this.direction.x) return;
        if (this.direction.y !== 0 && newDir.y === -this.direction.y) return;

        this.nextDirection = newDir;
    }

    handleSwipe(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        const minSwipeDistance = 30;

        if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            this.setDirection(dx > 0 ? 'right' : 'left');
        } else {
            this.setDirection(dy > 0 ? 'down' : 'up');
        }
    }

    startNewGame() {
        this.stopGame();

        // Initialize snake in the center
        const centerX = Math.floor(this.tileCount / 2);
        const centerY = Math.floor(this.tileCount / 2);
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];

        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.gameSpeed = 100;
        this.isRunning = true;
        this.isPaused = false;
        this.isStarted = true;

        this.updateScoreDisplay();
        this.hideMessage();
        this.startMessage.classList.add('hidden');
        this.updatePauseButton();
        this.spawnFood();
        this.soundManager.playStart();

        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);

        // Record this game as recently played
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('snake');
        }
    }

    stopGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        this.isRunning = false;
    }

    togglePause() {
        if (!this.isStarted || !this.isRunning) return;

        this.isPaused = !this.isPaused;
        this.updatePauseButton();

        if (this.isPaused) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        } else {
            this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        }
    }

    updatePauseButton() {
        this.pauseButton.textContent = this.isPaused ? '▶️' : '⏸️';
    }

    spawnFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

        this.food = newFood;
    }

    update() {
        if (this.isPaused) return;

        // Apply the queued direction
        this.direction = { ...this.nextDirection };

        // Calculate new head position
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= this.tileCount ||
            newHead.y < 0 || newHead.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            this.gameOver();
            return;
        }

        // Move snake
        this.snake.unshift(newHead);

        // Check food collision
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            this.updateScoreDisplay();
            this.soundManager.playEat();
            this.spawnFood();

            // Increase speed slightly every 50 points
            if (this.score % 50 === 0 && this.gameSpeed > 50) {
                this.gameSpeed -= 5;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
            }
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const isDark = document.body.classList.contains('dark-mode');

        // Clear canvas
        ctx.fillStyle = isDark ? '#1a3a24' : '#2d5a3a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines (subtle)
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.gridSize, 0);
            ctx.lineTo(i * this.gridSize, this.canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * this.gridSize);
            ctx.lineTo(this.canvas.width, i * this.gridSize);
            ctx.stroke();
        }

        // Draw food
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        const foodCenterX = this.food.x * this.gridSize + this.gridSize / 2;
        const foodCenterY = this.food.y * this.gridSize + this.gridSize / 2;
        ctx.arc(foodCenterX, foodCenterY, this.gridSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;

            // Gradient from head to tail
            const hue = 120 + (index * 2) % 40;
            const lightness = isHead ? 45 : 40 - Math.min(index * 0.5, 15);
            ctx.fillStyle = `hsl(${hue}, 60%, ${lightness}%)`;

            const padding = 1;
            const x = segment.x * this.gridSize + padding;
            const y = segment.y * this.gridSize + padding;
            const size = this.gridSize - padding * 2;

            // Rounded rectangles for segments
            const radius = isHead ? size / 3 : size / 4;
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, radius);
            ctx.fill();

            // Draw eyes on head
            if (isHead) {
                ctx.fillStyle = '#fff';
                const eyeSize = this.gridSize / 6;
                const eyeOffset = this.gridSize / 4;

                let eye1X, eye1Y, eye2X, eye2Y;

                if (this.direction.x === 1) { // Right
                    eye1X = x + size - eyeOffset;
                    eye1Y = y + eyeOffset;
                    eye2X = x + size - eyeOffset;
                    eye2Y = y + size - eyeOffset;
                } else if (this.direction.x === -1) { // Left
                    eye1X = x + eyeOffset;
                    eye1Y = y + eyeOffset;
                    eye2X = x + eyeOffset;
                    eye2Y = y + size - eyeOffset;
                } else if (this.direction.y === -1) { // Up
                    eye1X = x + eyeOffset;
                    eye1Y = y + eyeOffset;
                    eye2X = x + size - eyeOffset;
                    eye2Y = y + eyeOffset;
                } else { // Down
                    eye1X = x + eyeOffset;
                    eye1Y = y + size - eyeOffset;
                    eye2X = x + size - eyeOffset;
                    eye2Y = y + size - eyeOffset;
                }

                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
                ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                // Pupils
                ctx.fillStyle = '#000';
                const pupilSize = eyeSize / 2;
                ctx.beginPath();
                ctx.arc(eye1X + this.direction.x * 2, eye1Y + this.direction.y * 2, pupilSize, 0, Math.PI * 2);
                ctx.arc(eye2X + this.direction.x * 2, eye2Y + this.direction.y * 2, pupilSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    gameOver() {
        this.stopGame();
        this.soundManager.playGameOver();

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
            this.updateBestScoreDisplay();
        }

        this.showMessage(`Game Over!\nScore: ${this.score}`);
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = this.score;
    }

    updateBestScoreDisplay() {
        this.bestScoreDisplay.textContent = this.bestScore;
    }

    showMessage(message) {
        this.messageText.textContent = message;
        this.gameMessage.classList.remove('hidden');
    }

    hideMessage() {
        this.gameMessage.classList.add('hidden');
    }

    loadBestScore() {
        const saved = localStorage.getItem('snake-best-score');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveBestScore() {
        localStorage.setItem('snake-best-score', this.bestScore.toString());
    }
}

// Theme management
class ThemeManager {
    constructor() {
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.loadTheme();
        this.bindEvents();
    }

    bindEvents() {
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('game-hub-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');

        // Redraw game if running
        if (snakeGameInstance && snakeGameInstance.isStarted) {
            snakeGameInstance.draw();
        }
    }
}

// Initialize game when DOM is loaded
let snakeGameInstance = null;
let soundManagerInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    soundManagerInstance = new SoundManager();
    snakeGameInstance = new SnakeGame(soundManagerInstance);

    // Sound toggle button
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtn) {
        updateSoundButtonIcon(soundToggleBtn, soundManagerInstance.enabled);
        soundToggleBtn.addEventListener('click', () => {
            const enabled = soundManagerInstance.toggle();
            updateSoundButtonIcon(soundToggleBtn, enabled);
        });
    }
});

function updateSoundButtonIcon(button, enabled) {
    const onIcon = button.querySelector('.sound-on-icon');
    const offIcon = button.querySelector('.sound-off-icon');
    if (enabled) {
        onIcon.style.display = 'inline';
        offIcon.style.display = 'none';
    } else {
        onIcon.style.display = 'none';
        offIcon.style.display = 'inline';
    }
}
