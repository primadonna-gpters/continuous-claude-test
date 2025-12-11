// Pong Game

class Pong {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('game-overlay');
        this.overlayText = document.getElementById('overlay-text');
        this.playerScoreDisplay = document.getElementById('player-score');
        this.aiScoreDisplay = document.getElementById('ai-score');
        this.startBtn = document.getElementById('start-btn');
        this.playBtn = document.getElementById('play-btn');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.soundToggleBtn = document.getElementById('sound-toggle-btn');

        // Game settings
        this.paddleWidth = 10;
        this.paddleHeight = 80;
        this.ballSize = 10;
        this.winningScore = 11;

        // Difficulty settings
        this.difficulties = {
            easy: { aiSpeed: 3, ballSpeed: 5 },
            medium: { aiSpeed: 5, ballSpeed: 7 },
            hard: { aiSpeed: 7, ballSpeed: 9 }
        };

        // Game state
        this.playerPaddle = null;
        this.aiPaddle = null;
        this.ball = null;
        this.playerScore = 0;
        this.aiScore = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        this.animationId = null;
        this.difficulty = 'medium';

        // Input state
        this.keys = { up: false, down: false };
        this.mouseY = null;
        this.touchY = null;

        // Sound
        this.soundEnabled = true;
        this.audioContext = null;

        // Initialize
        this.loadSettings();
        this.setupCanvas();
        this.bindEvents();
        this.draw();
    }

    setupCanvas() {
        // Responsive canvas sizing
        const container = document.getElementById('game-container');
        const maxWidth = Math.min(600, container.clientWidth - 10);
        const aspectRatio = 400 / 600;

        this.canvas.width = maxWidth;
        this.canvas.height = maxWidth * aspectRatio;

        // Scale game elements based on canvas size
        this.scale = maxWidth / 600;
    }

    loadSettings() {
        // Load theme
        const savedTheme = localStorage.getItem('game-hub-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        // Load sound setting
        const soundSetting = localStorage.getItem('pong-sound');
        if (soundSetting !== null) {
            this.soundEnabled = soundSetting === 'true';
        }
        this.updateSoundButton();

        // Load difficulty
        const savedDifficulty = localStorage.getItem('pong-difficulty');
        if (savedDifficulty && this.difficulties[savedDifficulty]) {
            this.difficulty = savedDifficulty;
            this.difficultySelect.value = savedDifficulty;
        }
    }

    bindEvents() {
        // Start/Play buttons
        this.startBtn.addEventListener('click', () => this.startGame());
        this.playBtn.addEventListener('click', () => this.startGame());

        // Difficulty selection
        this.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            localStorage.setItem('pong-difficulty', this.difficulty);
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.keys.up = true;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                e.preventDefault();
                this.keys.down = true;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.isPlaying) {
                    this.startGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.keys.up = false;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.keys.down = false;
            }
        });

        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.touchY = (e.touches[0].clientY - rect.top) * (this.canvas.height / rect.height);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.touchY = (e.touches[0].clientY - rect.top) * (this.canvas.height / rect.height);
        });

        this.canvas.addEventListener('touchend', () => {
            this.touchY = null;
        });

        // Theme toggle
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Sound toggle
        this.soundToggleBtn.addEventListener('click', () => this.toggleSound());

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (!this.isPlaying) {
                this.draw();
            }
        });
    }

    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        switch(type) {
            case 'hit':
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'wall':
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.05);
                break;
            case 'score':
                oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
            case 'lose':
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.3);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
            case 'win':
                const playNote = (freq, startTime, duration) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.frequency.setValueAtTime(freq, startTime);
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.15, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };
                const now = this.audioContext.currentTime;
                playNote(523, now, 0.15);
                playNote(659, now + 0.15, 0.15);
                playNote(784, now + 0.3, 0.15);
                playNote(1047, now + 0.45, 0.3);
                return;
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('pong-sound', this.soundEnabled);
        this.updateSoundButton();
    }

    updateSoundButton() {
        const onIcon = this.soundToggleBtn.querySelector('.sound-on-icon');
        const offIcon = this.soundToggleBtn.querySelector('.sound-off-icon');
        if (this.soundEnabled) {
            onIcon.style.display = 'inline';
            offIcon.style.display = 'none';
        } else {
            onIcon.style.display = 'none';
            offIcon.style.display = 'inline';
        }
    }

    startGame() {
        this.initAudio();

        const paddleH = this.paddleHeight * this.scale;
        const paddleW = this.paddleWidth * this.scale;

        // Reset game state
        this.playerPaddle = {
            x: 20 * this.scale,
            y: this.canvas.height / 2 - paddleH / 2,
            width: paddleW,
            height: paddleH,
            speed: 8 * this.scale
        };

        this.aiPaddle = {
            x: this.canvas.width - 20 * this.scale - paddleW,
            y: this.canvas.height / 2 - paddleH / 2,
            width: paddleW,
            height: paddleH,
            speed: this.difficulties[this.difficulty].aiSpeed * this.scale
        };

        this.resetBall();
        this.playerScore = 0;
        this.aiScore = 0;
        this.playerScoreDisplay.textContent = '0';
        this.aiScoreDisplay.textContent = '0';
        this.isPlaying = true;
        this.isGameOver = false;

        // Hide overlay
        this.overlay.classList.add('hidden');

        // Record recent play
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('pong');
        }

        // Start game loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.gameLoop();
    }

    resetBall() {
        const ballS = this.ballSize * this.scale;
        const settings = this.difficulties[this.difficulty];

        this.ball = {
            x: this.canvas.width / 2 - ballS / 2,
            y: this.canvas.height / 2 - ballS / 2,
            size: ballS,
            speedX: settings.ballSpeed * this.scale * (Math.random() > 0.5 ? 1 : -1),
            speedY: (Math.random() * 4 - 2) * this.scale
        };
    }

    update() {
        if (!this.isPlaying || this.isGameOver) return;

        // Update player paddle
        this.updatePlayerPaddle();

        // Update AI paddle
        this.updateAIPaddle();

        // Update ball
        this.updateBall();

        // Check for scoring
        this.checkScoring();
    }

    updatePlayerPaddle() {
        // Keyboard control
        if (this.keys.up) {
            this.playerPaddle.y -= this.playerPaddle.speed;
        }
        if (this.keys.down) {
            this.playerPaddle.y += this.playerPaddle.speed;
        }

        // Mouse control
        if (this.mouseY !== null) {
            const targetY = this.mouseY - this.playerPaddle.height / 2;
            this.playerPaddle.y = targetY;
        }

        // Touch control
        if (this.touchY !== null) {
            const targetY = this.touchY - this.playerPaddle.height / 2;
            this.playerPaddle.y = targetY;
        }

        // Keep paddle in bounds
        this.playerPaddle.y = Math.max(0, Math.min(this.canvas.height - this.playerPaddle.height, this.playerPaddle.y));
    }

    updateAIPaddle() {
        const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
        const ballCenter = this.ball.y + this.ball.size / 2;

        // Add some "reaction time" and imperfection based on difficulty
        const reactionThreshold = this.difficulty === 'easy' ? 30 : this.difficulty === 'medium' ? 15 : 5;

        if (Math.abs(paddleCenter - ballCenter) > reactionThreshold * this.scale) {
            if (paddleCenter < ballCenter) {
                this.aiPaddle.y += this.aiPaddle.speed;
            } else {
                this.aiPaddle.y -= this.aiPaddle.speed;
            }
        }

        // Keep paddle in bounds
        this.aiPaddle.y = Math.max(0, Math.min(this.canvas.height - this.aiPaddle.height, this.aiPaddle.y));
    }

    updateBall() {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;

        // Top and bottom wall collision
        if (this.ball.y <= 0 || this.ball.y + this.ball.size >= this.canvas.height) {
            this.ball.speedY *= -1;
            this.ball.y = Math.max(0, Math.min(this.canvas.height - this.ball.size, this.ball.y));
            this.playSound('wall');
        }

        // Paddle collision
        this.checkPaddleCollision();
    }

    checkPaddleCollision() {
        // Player paddle collision
        if (this.ball.x <= this.playerPaddle.x + this.playerPaddle.width &&
            this.ball.x + this.ball.size >= this.playerPaddle.x &&
            this.ball.y + this.ball.size >= this.playerPaddle.y &&
            this.ball.y <= this.playerPaddle.y + this.playerPaddle.height) {

            this.ball.x = this.playerPaddle.x + this.playerPaddle.width;
            this.ball.speedX = Math.abs(this.ball.speedX);

            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.y + this.ball.size / 2 - this.playerPaddle.y) / this.playerPaddle.height;
            this.ball.speedY = (hitPos - 0.5) * 10 * this.scale;

            // Slight speed increase
            this.ball.speedX *= 1.05;
            this.playSound('hit');
        }

        // AI paddle collision
        if (this.ball.x + this.ball.size >= this.aiPaddle.x &&
            this.ball.x <= this.aiPaddle.x + this.aiPaddle.width &&
            this.ball.y + this.ball.size >= this.aiPaddle.y &&
            this.ball.y <= this.aiPaddle.y + this.aiPaddle.height) {

            this.ball.x = this.aiPaddle.x - this.ball.size;
            this.ball.speedX = -Math.abs(this.ball.speedX);

            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.y + this.ball.size / 2 - this.aiPaddle.y) / this.aiPaddle.height;
            this.ball.speedY = (hitPos - 0.5) * 10 * this.scale;

            // Slight speed increase
            this.ball.speedX *= 1.05;
            this.playSound('hit');
        }
    }

    checkScoring() {
        // Player scores
        if (this.ball.x + this.ball.size > this.canvas.width) {
            this.playerScore++;
            this.playerScoreDisplay.textContent = this.playerScore;
            this.playSound('score');

            if (this.playerScore >= this.winningScore) {
                this.gameOver(true);
            } else {
                this.resetBall();
            }
        }

        // AI scores
        if (this.ball.x < 0) {
            this.aiScore++;
            this.aiScoreDisplay.textContent = this.aiScore;
            this.playSound('lose');

            if (this.aiScore >= this.winningScore) {
                this.gameOver(false);
            } else {
                this.resetBall();
            }
        }
    }

    gameOver(playerWon) {
        this.isGameOver = true;
        this.isPlaying = false;

        if (playerWon) {
            this.playSound('win');
            this.overlayText.textContent = '🎉 You Win!';
        } else {
            this.overlayText.textContent = '😢 AI Wins!';
        }

        this.playBtn.textContent = '↺ Play Again';
        this.overlay.classList.remove('hidden');
    }

    draw() {
        const ctx = this.ctx;

        // Clear canvas with black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        ctx.setLineDash([10 * this.scale, 10 * this.scale]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2 * this.scale;
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, 0);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw paddles
        if (this.playerPaddle) {
            // Player paddle (green)
            ctx.fillStyle = '#2ecc71';
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 10 * this.scale;
            ctx.fillRect(this.playerPaddle.x, this.playerPaddle.y, this.playerPaddle.width, this.playerPaddle.height);
            ctx.shadowBlur = 0;
        }

        if (this.aiPaddle) {
            // AI paddle (red)
            ctx.fillStyle = '#e74c3c';
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 10 * this.scale;
            ctx.fillRect(this.aiPaddle.x, this.aiPaddle.y, this.aiPaddle.width, this.aiPaddle.height);
            ctx.shadowBlur = 0;
        }

        // Draw ball
        if (this.ball) {
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 15 * this.scale;
            ctx.beginPath();
            ctx.arc(this.ball.x + this.ball.size / 2, this.ball.y + this.ball.size / 2, this.ball.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Draw static ball in center when game not started
            const ballS = this.ballSize * this.scale;
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 15 * this.scale;
            ctx.beginPath();
            ctx.arc(this.canvas.width / 2, this.canvas.height / 2, ballS / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw static paddles
            const paddleH = this.paddleHeight * this.scale;
            const paddleW = this.paddleWidth * this.scale;

            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(20 * this.scale, this.canvas.height / 2 - paddleH / 2, paddleW, paddleH);

            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.canvas.width - 20 * this.scale - paddleW, this.canvas.height / 2 - paddleH / 2, paddleW, paddleH);
        }

        // Draw score in large text on the field
        ctx.font = `bold ${60 * this.scale}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.textAlign = 'center';
        ctx.fillText(this.playerScore, this.canvas.width * 0.25, this.canvas.height * 0.3);
        ctx.fillText(this.aiScore, this.canvas.width * 0.75, this.canvas.height * 0.3);
    }

    gameLoop() {
        this.update();
        this.draw();

        if (this.isPlaying) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Pong();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Pong };
}
