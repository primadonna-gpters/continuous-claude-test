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
        const saved = localStorage.getItem('tetris-sound');
        return saved !== 'false';
    }

    saveSoundPreference() {
        localStorage.setItem('tetris-sound', this.enabled.toString());
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

    playMove() {
        this.playTone(200, 0.05, 'square', 0.1);
    }

    playRotate() {
        this.playTone(400, 0.08, 'sine', 0.15);
    }

    playDrop() {
        this.playTone(150, 0.15, 'triangle', 0.2);
    }

    playLineClear(lineCount) {
        if (!this.enabled) return;
        this.initAudioContext();

        const baseFreq = 440;
        for (let i = 0; i < lineCount; i++) {
            setTimeout(() => {
                this.playTone(baseFreq + i * 100, 0.15, 'sine', 0.2);
            }, i * 80);
        }
    }

    playTetris() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 100);
        });
    }

    playHold() {
        this.playTone(300, 0.1, 'triangle', 0.15);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [392, 349, 330, 294, 262]; // G4, F4, E4, D4, C4
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.2), i * 200);
        });
    }

    playStart() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.12, 'sine', 0.2), i * 80);
        });
    }

    playLevelUp() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [523, 659, 784, 880]; // C5, E5, G5, A5
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'square', 0.15), i * 100);
        });
    }
}

// Tetromino definitions
const TETROMINOES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0f0'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#f0a000'
    }
};

const TETROMINO_NAMES = Object.keys(TETROMINOES);

class TetrisGame {
    constructor(soundManager) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        this.soundManager = soundManager;

        this.cols = 10;
        this.rows = 20;
        this.blockSize = 25;

        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;

        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.level = 1;
        this.lines = 0;
        this.gameSpeed = 1000;
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isStarted = false;

        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.levelDisplay = document.getElementById('level');
        this.linesDisplay = document.getElementById('lines');
        this.gameMessage = document.getElementById('game-message');
        this.startMessage = document.getElementById('start-message');
        this.messageText = this.gameMessage.querySelector('p');
        this.newGameButton = document.getElementById('new-game-btn');
        this.retryButton = document.getElementById('retry-btn');
        this.pauseButton = document.getElementById('pause-btn');

        this.bag = [];

        this.resizeCanvas();
        this.bindEvents();
        this.updateBestScoreDisplay();
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.blockSize = Math.floor(Math.min(width / this.cols, height / this.rows));

        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;

        // Next piece canvas
        this.nextCanvas.width = 100;
        this.nextCanvas.height = 80;

        // Hold piece canvas
        this.holdCanvas.width = 100;
        this.holdCanvas.height = 80;

        if (this.isStarted) {
            this.draw();
            this.drawNextPiece();
            this.drawHoldPiece();
        }
    }

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.retryButton.addEventListener('click', () => this.startNewGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());

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
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    handleKeyDown(event) {
        if (!this.isRunning || this.isPaused) {
            if (event.key === 'p' || event.key === 'P') {
                this.togglePause();
            }
            return;
        }

        const keyActions = {
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'ArrowDown': 'softDrop',
            'ArrowUp': 'rotateRight',
            ' ': 'hardDrop',
            'x': 'rotateRight',
            'X': 'rotateRight',
            'z': 'rotateLeft',
            'Z': 'rotateLeft',
            'c': 'hold',
            'C': 'hold',
            'p': 'pause',
            'P': 'pause'
        };

        const action = keyActions[event.key];
        if (action) {
            event.preventDefault();
            this.handleAction(action);
        }
    }

    handleAction(action) {
        if (!this.isRunning && action !== 'pause') return;

        switch (action) {
            case 'left':
                this.movePiece(-1, 0);
                break;
            case 'right':
                this.movePiece(1, 0);
                break;
            case 'softDrop':
                if (this.movePiece(0, 1)) {
                    this.score += 1;
                    this.updateScoreDisplay();
                }
                break;
            case 'hardDrop':
                this.hardDrop();
                break;
            case 'rotateRight':
                this.rotatePiece(1);
                break;
            case 'rotateLeft':
                this.rotatePiece(-1);
                break;
            case 'hold':
                this.holdCurrentPiece();
                break;
            case 'pause':
                this.togglePause();
                break;
        }
    }

    startNewGame() {
        this.stopGame();

        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.bag = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameSpeed = 1000;
        this.holdPiece = null;
        this.canHold = true;
        this.isRunning = true;
        this.isPaused = false;
        this.isStarted = true;

        this.spawnNextPiece();
        this.spawnPiece();

        this.updateScoreDisplay();
        this.updateLevelDisplay();
        this.updateLinesDisplay();
        this.hideMessage();
        this.startMessage.classList.add('hidden');
        this.updatePauseButton();
        this.soundManager.playStart();

        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);

        // Record this game as recently played
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('tetris');
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
        if (!this.isStarted) return;

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

    getRandomPiece() {
        if (this.bag.length === 0) {
            this.bag = [...TETROMINO_NAMES];
            // Shuffle bag
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        return this.bag.pop();
    }

    spawnNextPiece() {
        const name = this.getRandomPiece();
        const tetromino = TETROMINOES[name];
        this.nextPiece = {
            name,
            shape: tetromino.shape.map(row => [...row]),
            color: tetromino.color
        };
        this.drawNextPiece();
    }

    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.currentPiece.x = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
        this.currentPiece.y = 0;

        this.spawnNextPiece();
        this.canHold = true;

        // Check if piece can be placed
        if (this.checkCollision(0, 0)) {
            this.gameOver();
        }

        this.draw();
    }

    holdCurrentPiece() {
        if (!this.canHold) return;

        this.soundManager.playHold();
        this.canHold = false;

        const currentName = this.currentPiece.name;

        if (this.holdPiece) {
            // Swap with hold piece
            const holdName = this.holdPiece.name;
            const tetromino = TETROMINOES[holdName];
            this.currentPiece = {
                name: holdName,
                shape: tetromino.shape.map(row => [...row]),
                color: tetromino.color,
                x: Math.floor((this.cols - tetromino.shape[0].length) / 2),
                y: 0
            };
        } else {
            // Put current in hold and spawn new piece
            this.spawnPiece();
        }

        const holdTetromino = TETROMINOES[currentName];
        this.holdPiece = {
            name: currentName,
            shape: holdTetromino.shape.map(row => [...row]),
            color: holdTetromino.color
        };

        this.drawHoldPiece();
        this.draw();
    }

    checkCollision(offsetX, offsetY, shape = null) {
        const piece = this.currentPiece;
        const testShape = shape || piece.shape;

        for (let y = 0; y < testShape.length; y++) {
            for (let x = 0; x < testShape[y].length; x++) {
                if (testShape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;

                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    movePiece(dx, dy) {
        if (!this.checkCollision(dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            if (dx !== 0) this.soundManager.playMove();
            this.draw();
            return true;
        }
        return false;
    }

    rotatePiece(direction) {
        const piece = this.currentPiece;
        const originalShape = piece.shape.map(row => [...row]);

        // Rotate shape
        const size = piece.shape.length;
        const rotated = Array(size).fill(null).map(() => Array(size).fill(0));

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (direction === 1) {
                    rotated[x][size - 1 - y] = piece.shape[y][x];
                } else {
                    rotated[size - 1 - x][y] = piece.shape[y][x];
                }
            }
        }

        piece.shape = rotated;

        // Wall kick - try different offsets
        const kicks = [0, -1, 1, -2, 2];
        let kicked = false;

        for (const kickX of kicks) {
            if (!this.checkCollision(kickX, 0)) {
                piece.x += kickX;
                kicked = true;
                break;
            }
        }

        if (!kicked) {
            // Revert rotation
            piece.shape = originalShape;
        } else {
            this.soundManager.playRotate();
        }

        this.draw();
    }

    hardDrop() {
        let dropDistance = 0;
        while (!this.checkCollision(0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.updateScoreDisplay();
        this.soundManager.playDrop();
        this.lockPiece();
    }

    lockPiece() {
        const piece = this.currentPiece;

        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = piece.color;
                    }
                }
            }
        }

        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++; // Check same row again
            }
        }

        if (linesCleared > 0) {
            // Scoring based on lines cleared
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;

            if (linesCleared === 4) {
                this.soundManager.playTetris();
            } else {
                this.soundManager.playLineClear(linesCleared);
            }

            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.gameSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
                this.soundManager.playLevelUp();
            }

            this.updateScoreDisplay();
            this.updateLevelDisplay();
            this.updateLinesDisplay();
        }
    }

    update() {
        if (this.isPaused) return;

        if (!this.movePiece(0, 1)) {
            this.lockPiece();
        }
    }

    draw() {
        const ctx = this.ctx;
        const isDark = document.body.classList.contains('dark-mode');

        // Clear canvas
        ctx.fillStyle = isDark ? '#0a0a1e' : '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.blockSize, 0);
            ctx.lineTo(x * this.blockSize, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.blockSize);
            ctx.lineTo(this.canvas.width, y * this.blockSize);
            ctx.stroke();
        }

        // Draw board
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(ctx, x, y, this.board[y][x]);
                }
            }
        }

        // Draw ghost piece
        if (this.currentPiece) {
            let ghostY = this.currentPiece.y;
            while (!this.checkCollision(0, ghostY - this.currentPiece.y + 1)) {
                ghostY++;
            }

            ctx.globalAlpha = 0.3;
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(ctx, this.currentPiece.x + x, ghostY + y, this.currentPiece.color);
                    }
                }
            }
            ctx.globalAlpha = 1;

            // Draw current piece
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(ctx, this.currentPiece.x + x, this.currentPiece.y + y, this.currentPiece.color);
                    }
                }
            }
        }
    }

    drawBlock(ctx, x, y, color) {
        const padding = 1;
        const bx = x * this.blockSize + padding;
        const by = y * this.blockSize + padding;
        const size = this.blockSize - padding * 2;

        // Main block
        ctx.fillStyle = color;
        ctx.fillRect(bx, by, size, size);

        // Highlight (top-left)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(bx, by, size, 3);
        ctx.fillRect(bx, by, 3, size);

        // Shadow (bottom-right)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(bx, by + size - 3, size, 3);
        ctx.fillRect(bx + size - 3, by, 3, size);
    }

    drawNextPiece() {
        const ctx = this.nextCtx;
        const isDark = document.body.classList.contains('dark-mode');

        ctx.fillStyle = isDark ? '#0a0a1e' : '#1a1a2e';
        ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const blockSize = 18;
        const shape = this.nextPiece.shape;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawPreviewBlock(ctx, offsetX + x * blockSize, offsetY + y * blockSize, blockSize, this.nextPiece.color);
                }
            }
        }
    }

    drawHoldPiece() {
        const ctx = this.holdCtx;
        const isDark = document.body.classList.contains('dark-mode');

        ctx.fillStyle = isDark ? '#0a0a1e' : '#1a1a2e';
        ctx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);

        if (!this.holdPiece) return;

        const blockSize = 18;
        const shape = this.holdPiece.shape;
        const offsetX = (this.holdCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.holdCanvas.height - shape.length * blockSize) / 2;

        ctx.globalAlpha = this.canHold ? 1 : 0.4;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawPreviewBlock(ctx, offsetX + x * blockSize, offsetY + y * blockSize, blockSize, this.holdPiece.color);
                }
            }
        }

        ctx.globalAlpha = 1;
    }

    drawPreviewBlock(ctx, x, y, size, color) {
        const padding = 1;
        ctx.fillStyle = color;
        ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    }

    gameOver() {
        this.stopGame();
        this.soundManager.playGameOver();

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
            this.updateBestScoreDisplay();
        }

        this.showMessage(`Game Over!\nScore: ${this.score}\nLevel: ${this.level}`);
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = this.score;
    }

    updateBestScoreDisplay() {
        this.bestScoreDisplay.textContent = this.bestScore;
    }

    updateLevelDisplay() {
        this.levelDisplay.textContent = this.level;
    }

    updateLinesDisplay() {
        this.linesDisplay.textContent = this.lines;
    }

    showMessage(message) {
        this.messageText.textContent = message;
        this.gameMessage.classList.remove('hidden');
    }

    hideMessage() {
        this.gameMessage.classList.add('hidden');
    }

    loadBestScore() {
        const saved = localStorage.getItem('tetris-best-score');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveBestScore() {
        localStorage.setItem('tetris-best-score', this.bestScore.toString());
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
        if (tetrisGameInstance && tetrisGameInstance.isStarted) {
            tetrisGameInstance.draw();
            tetrisGameInstance.drawNextPiece();
            tetrisGameInstance.drawHoldPiece();
        }
    }
}

// Initialize game when DOM is loaded
let tetrisGameInstance = null;
let soundManagerInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    soundManagerInstance = new SoundManager();
    tetrisGameInstance = new TetrisGame(soundManagerInstance);

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
