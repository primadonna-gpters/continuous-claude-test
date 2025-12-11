// Breakout Game

class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Game dimensions
        this.baseWidth = 480;
        this.baseHeight = 400;

        // Set canvas dimensions
        this.resizeCanvas();

        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('breakout-best-score')) || 0;
        this.level = 1;
        this.lives = 3;

        // Sound settings
        this.soundEnabled = localStorage.getItem('breakout-sound') !== 'false';
        this.audioContext = null;

        // Paddle
        this.paddleWidth = 80;
        this.paddleHeight = 12;
        this.paddleX = (this.baseWidth - this.paddleWidth) / 2;
        this.paddleSpeed = 8;
        this.paddleMoving = 0; // -1 left, 0 none, 1 right

        // Ball
        this.ballRadius = 8;
        this.ballX = this.baseWidth / 2;
        this.ballY = this.baseHeight - 50;
        this.ballSpeedX = 0;
        this.ballSpeedY = 0;
        this.baseBallSpeed = 5;
        this.ballAttached = true;

        // Bricks
        this.brickRowCount = 5;
        this.brickColumnCount = 10;
        this.brickWidth = 42;
        this.brickHeight = 15;
        this.brickPadding = 4;
        this.brickOffsetTop = 40;
        this.brickOffsetLeft = 10;
        this.bricks = [];

        // Colors for brick rows
        this.brickColors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'];

        // Initialize
        this.initBricks();
        this.setupEventListeners();
        this.updateUI();
        this.applyTheme();
        this.applySoundUI();

        // Animation loop
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const rect = container.getBoundingClientRect();
        this.scale = rect.width / this.baseWidth;
        this.canvas.width = this.baseWidth * this.scale;
        this.canvas.height = this.baseHeight * this.scale;
        this.ctx.scale(this.scale, this.scale);
    }

    initBricks() {
        this.bricks = [];
        for (let r = 0; r < this.brickRowCount; r++) {
            this.bricks[r] = [];
            for (let c = 0; c < this.brickColumnCount; c++) {
                this.bricks[r][c] = {
                    x: 0,
                    y: 0,
                    status: 1,
                    color: this.brickColors[r % this.brickColors.length]
                };
            }
        }
        this.calculateBrickPositions();
    }

    calculateBrickPositions() {
        for (let r = 0; r < this.brickRowCount; r++) {
            for (let c = 0; c < this.brickColumnCount; c++) {
                const brickX = this.brickOffsetLeft + c * (this.brickWidth + this.brickPadding);
                const brickY = this.brickOffsetTop + r * (this.brickHeight + this.brickPadding);
                this.bricks[r][c].x = brickX;
                this.bricks[r][c].y = brickY;
            }
        }
    }

    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', () => this.handleClick());

        // Touch
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));

        // Buttons
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.newGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
        document.getElementById('sound-toggle-btn').addEventListener('click', () => this.toggleSound());

        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            const action = btn.dataset.action;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMobileControl(action, true);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleMobileControl(action, false);
            });
            btn.addEventListener('mousedown', () => this.handleMobileControl(action, true));
            btn.addEventListener('mouseup', () => this.handleMobileControl(action, false));
            btn.addEventListener('mouseleave', () => this.handleMobileControl(action, false));
        });

        // Resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
    }

    handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            this.paddleMoving = -1;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            this.paddleMoving = 1;
        } else if (e.key === ' ') {
            e.preventDefault();
            if (!this.gameStarted) {
                this.startGame();
            } else if (this.ballAttached) {
                this.launchBall();
            }
        } else if (e.key === 'p' || e.key === 'P') {
            if (this.gameStarted && !this.gameOver) {
                this.togglePause();
            }
        }
    }

    handleKeyUp(e) {
        if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && this.paddleMoving === -1) {
            this.paddleMoving = 0;
        } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && this.paddleMoving === 1) {
            this.paddleMoving = 0;
        }
    }

    handleMouseMove(e) {
        if (!this.gameStarted || this.gameOver || this.isPaused) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / this.scale;
        this.paddleX = mouseX - this.paddleWidth / 2;

        // Clamp paddle position
        this.paddleX = Math.max(0, Math.min(this.baseWidth - this.paddleWidth, this.paddleX));

        if (this.ballAttached) {
            this.ballX = this.paddleX + this.paddleWidth / 2;
        }
    }

    handleClick() {
        if (!this.gameStarted) {
            this.startGame();
        } else if (this.ballAttached && !this.isPaused) {
            this.launchBall();
        }
    }

    handleTouchMove(e) {
        if (!this.gameStarted || this.gameOver || this.isPaused) return;
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const touchX = (e.touches[0].clientX - rect.left) / this.scale;
        this.paddleX = touchX - this.paddleWidth / 2;

        // Clamp paddle position
        this.paddleX = Math.max(0, Math.min(this.baseWidth - this.paddleWidth, this.paddleX));

        if (this.ballAttached) {
            this.ballX = this.paddleX + this.paddleWidth / 2;
        }
    }

    handleTouchStart(e) {
        if (!this.gameStarted) {
            this.startGame();
        } else if (this.ballAttached && !this.isPaused) {
            this.launchBall();
        }
    }

    handleMobileControl(action, isPressed) {
        if (action === 'left') {
            this.paddleMoving = isPressed ? -1 : 0;
        } else if (action === 'right') {
            this.paddleMoving = isPressed ? 1 : 0;
        } else if (action === 'launch' && isPressed) {
            if (!this.gameStarted) {
                this.startGame();
            } else if (this.ballAttached) {
                this.launchBall();
            }
        }
    }

    startGame() {
        document.getElementById('start-message').classList.add('hidden');
        this.gameStarted = true;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.initBricks();
        this.resetBall();
        this.updateUI();

        // Record this game as recently played
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('breakout');
        }
    }

    newGame() {
        document.getElementById('game-message').classList.add('hidden');
        this.startGame();
    }

    resetBall() {
        this.ballX = this.paddleX + this.paddleWidth / 2;
        this.ballY = this.baseHeight - 50;
        this.ballSpeedX = 0;
        this.ballSpeedY = 0;
        this.ballAttached = true;
    }

    launchBall() {
        if (!this.ballAttached) return;

        this.ballAttached = false;
        const angle = (Math.random() * 60 - 30) * Math.PI / 180; // -30 to 30 degrees
        const speed = this.baseBallSpeed + (this.level - 1) * 0.5;
        this.ballSpeedX = Math.sin(angle) * speed;
        this.ballSpeedY = -Math.cos(angle) * speed;
        this.playSound('launch');
    }

    togglePause() {
        if (!this.gameStarted || this.gameOver) return;
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = this.isPaused ? '▶️' : '⏸️';
    }

    update() {
        if (!this.gameStarted || this.gameOver || this.isPaused) return;

        // Move paddle
        this.paddleX += this.paddleMoving * this.paddleSpeed;
        this.paddleX = Math.max(0, Math.min(this.baseWidth - this.paddleWidth, this.paddleX));

        // Update ball position if attached
        if (this.ballAttached) {
            this.ballX = this.paddleX + this.paddleWidth / 2;
            this.ballY = this.baseHeight - 50;
            return;
        }

        // Move ball
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        // Wall collisions
        if (this.ballX - this.ballRadius < 0) {
            this.ballX = this.ballRadius;
            this.ballSpeedX = -this.ballSpeedX;
            this.playSound('wall');
        } else if (this.ballX + this.ballRadius > this.baseWidth) {
            this.ballX = this.baseWidth - this.ballRadius;
            this.ballSpeedX = -this.ballSpeedX;
            this.playSound('wall');
        }

        if (this.ballY - this.ballRadius < 0) {
            this.ballY = this.ballRadius;
            this.ballSpeedY = -this.ballSpeedY;
            this.playSound('wall');
        }

        // Paddle collision
        if (this.ballY + this.ballRadius > this.baseHeight - this.paddleHeight - 10 &&
            this.ballY + this.ballRadius < this.baseHeight - 10 &&
            this.ballX > this.paddleX &&
            this.ballX < this.paddleX + this.paddleWidth) {

            // Calculate bounce angle based on where ball hits paddle
            const hitPos = (this.ballX - this.paddleX) / this.paddleWidth;
            const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63 to 63 degrees
            const speed = Math.sqrt(this.ballSpeedX ** 2 + this.ballSpeedY ** 2);

            this.ballSpeedX = Math.sin(angle) * speed;
            this.ballSpeedY = -Math.abs(Math.cos(angle) * speed);
            this.ballY = this.baseHeight - this.paddleHeight - 10 - this.ballRadius;

            this.playSound('paddle');
        }

        // Ball out of bounds
        if (this.ballY + this.ballRadius > this.baseHeight) {
            this.lives--;
            this.updateUI();
            this.playSound('lose');

            if (this.lives <= 0) {
                this.endGame(false);
            } else {
                this.resetBall();
            }
        }

        // Brick collision
        this.checkBrickCollision();

        // Check level complete
        if (this.isLevelComplete()) {
            this.nextLevel();
        }
    }

    checkBrickCollision() {
        for (let r = 0; r < this.brickRowCount; r++) {
            for (let c = 0; c < this.brickColumnCount; c++) {
                const brick = this.bricks[r][c];
                if (brick.status !== 1) continue;

                if (this.ballX > brick.x &&
                    this.ballX < brick.x + this.brickWidth &&
                    this.ballY > brick.y &&
                    this.ballY < brick.y + this.brickHeight) {

                    // Determine collision side
                    const overlapLeft = this.ballX - brick.x;
                    const overlapRight = brick.x + this.brickWidth - this.ballX;
                    const overlapTop = this.ballY - brick.y;
                    const overlapBottom = brick.y + this.brickHeight - this.ballY;

                    const minOverlapX = Math.min(overlapLeft, overlapRight);
                    const minOverlapY = Math.min(overlapTop, overlapBottom);

                    if (minOverlapX < minOverlapY) {
                        this.ballSpeedX = -this.ballSpeedX;
                    } else {
                        this.ballSpeedY = -this.ballSpeedY;
                    }

                    brick.status = 0;
                    this.score += (this.brickRowCount - r) * 10; // Higher rows worth more
                    this.updateUI();
                    this.playSound('brick');

                    return; // Only break one brick per frame
                }
            }
        }
    }

    isLevelComplete() {
        for (let r = 0; r < this.brickRowCount; r++) {
            for (let c = 0; c < this.brickColumnCount; c++) {
                if (this.bricks[r][c].status === 1) {
                    return false;
                }
            }
        }
        return true;
    }

    nextLevel() {
        this.level++;
        this.playSound('levelUp');
        this.initBricks();
        this.resetBall();
        this.updateUI();
    }

    endGame(won) {
        this.gameOver = true;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('breakout-best-score', this.bestScore.toString());
            this.updateUI();
        }

        const message = won
            ? `You Win!\nScore: ${this.score}`
            : `Game Over\nScore: ${this.score}`;

        document.getElementById('game-message').querySelector('p').textContent = message;
        document.getElementById('game-message').classList.remove('hidden');

        this.playSound(won ? 'win' : 'gameOver');
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

        // Draw bricks
        for (let r = 0; r < this.brickRowCount; r++) {
            for (let c = 0; c < this.brickColumnCount; c++) {
                const brick = this.bricks[r][c];
                if (brick.status === 1) {
                    this.ctx.fillStyle = brick.color;
                    this.ctx.beginPath();
                    this.roundRect(brick.x, brick.y, this.brickWidth, this.brickHeight, 3);
                    this.ctx.fill();

                    // Highlight
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.fillRect(brick.x, brick.y, this.brickWidth, 3);
                }
            }
        }

        // Draw paddle
        const gradient = this.ctx.createLinearGradient(
            this.paddleX, this.baseHeight - this.paddleHeight - 10,
            this.paddleX, this.baseHeight - 10
        );
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.roundRect(
            this.paddleX,
            this.baseHeight - this.paddleHeight - 10,
            this.paddleWidth,
            this.paddleHeight,
            4
        );
        this.ctx.fill();

        // Draw ball
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.beginPath();
        this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Ball highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(this.ballX - 2, this.ballY - 2, this.ballRadius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
    }

    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime > 16) { // ~60fps
            this.update();
            this.draw();
            this.lastTime = currentTime;
        }

        requestAnimationFrame(this.animate);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
    }

    // Theme management
    applyTheme() {
        const savedTheme = localStorage.getItem('game-hub-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
    }

    // Sound management
    applySoundUI() {
        const soundOnIcon = document.querySelector('.sound-on-icon');
        const soundOffIcon = document.querySelector('.sound-off-icon');

        if (this.soundEnabled) {
            soundOnIcon.style.display = 'inline';
            soundOffIcon.style.display = 'none';
        } else {
            soundOnIcon.style.display = 'none';
            soundOffIcon.style.display = 'inline';
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('breakout-sound', this.soundEnabled.toString());
        this.applySoundUI();
    }

    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        try {
            this.initAudio();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            switch (type) {
                case 'brick':
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialDecayTo = 0.01;
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.1);
                    break;
                case 'paddle':
                    oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                    break;
                case 'wall':
                    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.03);
                    break;
                case 'launch':
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.15);
                    break;
                case 'lose':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;
                case 'levelUp':
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(554, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.2);
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                case 'gameOver':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(294, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime + 0.15);
                    oscillator.frequency.setValueAtTime(165, this.audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                    break;
                case 'win':
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
                    oscillator.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                    break;
            }
        } catch (e) {
            // Audio not supported
        }
    }
}

// Initialize game
const game = new BreakoutGame();

// Export for testing (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BreakoutGame };
}
