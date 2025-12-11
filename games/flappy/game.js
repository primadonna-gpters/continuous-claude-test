// Flappy Bird Game

class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('game-overlay');
        this.overlayText = document.getElementById('overlay-text');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.startBtn = document.getElementById('start-btn');
        this.playBtn = document.getElementById('play-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.soundToggleBtn = document.getElementById('sound-toggle-btn');

        // Game settings
        this.gravity = 0.5;
        this.jumpStrength = -8;
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpeed = 3;
        this.pipeSpawnInterval = 1500;
        this.minPipeHeight = 50;

        // Game state
        this.bird = null;
        this.pipes = [];
        this.score = 0;
        this.bestScore = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        this.animationId = null;
        this.lastPipeSpawn = 0;

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
        const maxWidth = Math.min(400, container.clientWidth - 20);
        const aspectRatio = 600 / 400;

        this.canvas.width = maxWidth;
        this.canvas.height = maxWidth * aspectRatio;

        // Scale game elements based on canvas size
        this.scale = maxWidth / 400;
    }

    loadSettings() {
        // Load best score
        const saved = localStorage.getItem('flappy-best-score');
        this.bestScore = saved ? parseInt(saved) : 0;
        this.bestScoreDisplay.textContent = this.bestScore;

        // Load theme
        const savedTheme = localStorage.getItem('game-hub-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        // Load sound setting
        const soundSetting = localStorage.getItem('flappy-sound');
        if (soundSetting !== null) {
            this.soundEnabled = soundSetting === 'true';
        }
        this.updateSoundButton();
    }

    bindEvents() {
        // Start/Play buttons
        this.startBtn.addEventListener('click', () => this.startGame());
        this.playBtn.addEventListener('click', () => this.startGame());

        // Jump controls
        this.canvas.addEventListener('click', () => this.handleInput());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleInput();
            }
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

    handleInput() {
        if (!this.isPlaying && !this.isGameOver) {
            this.startGame();
        } else if (this.isPlaying && !this.isGameOver) {
            this.jump();
        } else if (this.isGameOver) {
            this.startGame();
        }
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
            case 'jump':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'score':
                oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
            case 'hit':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('flappy-sound', this.soundEnabled);
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

        // Reset game state
        this.bird = {
            x: this.canvas.width * 0.2,
            y: this.canvas.height / 2,
            width: 34 * this.scale,
            height: 24 * this.scale,
            velocity: 0,
            rotation: 0
        };
        this.pipes = [];
        this.score = 0;
        this.scoreDisplay.textContent = '0';
        this.isPlaying = true;
        this.isGameOver = false;
        this.lastPipeSpawn = Date.now();

        // Hide overlay
        this.overlay.classList.add('hidden');

        // Record recent play
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('flappy');
        }

        // Start game loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.gameLoop();
    }

    jump() {
        if (this.bird) {
            this.bird.velocity = this.jumpStrength * this.scale;
            this.playSound('jump');
        }
    }

    spawnPipe() {
        const minTop = this.minPipeHeight * this.scale;
        const maxTop = this.canvas.height - (this.pipeGap * this.scale) - minTop;
        const topHeight = minTop + Math.random() * (maxTop - minTop);

        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + (this.pipeGap * this.scale),
            width: this.pipeWidth * this.scale,
            passed: false
        });
    }

    update() {
        if (!this.isPlaying || this.isGameOver) return;

        // Update bird
        this.bird.velocity += this.gravity * this.scale;
        this.bird.y += this.bird.velocity;

        // Bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

        // Spawn pipes
        const now = Date.now();
        if (now - this.lastPipeSpawn > this.pipeSpawnInterval) {
            this.spawnPipe();
            this.lastPipeSpawn = now;
        }

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed * this.scale;

            // Check scoring
            if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.scoreDisplay.textContent = this.score;
                this.playSound('score');
            }

            // Remove off-screen pipes
            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(i, 1);
            }
        }

        // Check collisions
        this.checkCollisions();
    }

    checkCollisions() {
        // Ground and ceiling collision
        if (this.bird.y + this.bird.height > this.canvas.height || this.bird.y < 0) {
            this.gameOver();
            return;
        }

        // Pipe collision
        for (const pipe of this.pipes) {
            // Bird hitbox (slightly smaller for better gameplay)
            const birdLeft = this.bird.x + 4 * this.scale;
            const birdRight = this.bird.x + this.bird.width - 4 * this.scale;
            const birdTop = this.bird.y + 4 * this.scale;
            const birdBottom = this.bird.y + this.bird.height - 4 * this.scale;

            // Check if bird is within pipe x range
            if (birdRight > pipe.x && birdLeft < pipe.x + pipe.width) {
                // Check if bird hits top or bottom pipe
                if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
                    this.gameOver();
                    return;
                }
            }
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.isPlaying = false;
        this.playSound('hit');

        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappy-best-score', this.bestScore);
            this.bestScoreDisplay.textContent = this.bestScore;
        }

        // Show overlay
        this.overlayText.textContent = `Game Over! Score: ${this.score}`;
        this.playBtn.textContent = '↺ Retry';
        this.overlay.classList.remove('hidden');
    }

    draw() {
        const ctx = this.ctx;
        const isDark = document.body.classList.contains('dark-mode');

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        if (isDark) {
            gradient.addColorStop(0, '#1a1a3e');
            gradient.addColorStop(1, '#2a2a4e');
        } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98D8C8');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground
        ctx.fillStyle = isDark ? '#2d5a3a' : '#8BC34A';
        ctx.fillRect(0, this.canvas.height - 20 * this.scale, this.canvas.width, 20 * this.scale);

        // Draw pipes
        for (const pipe of this.pipes) {
            // Top pipe
            ctx.fillStyle = isDark ? '#2d6a4f' : '#4CAF50';
            ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);

            // Pipe cap (top)
            ctx.fillStyle = isDark ? '#40916c' : '#66BB6A';
            ctx.fillRect(pipe.x - 5 * this.scale, pipe.topHeight - 20 * this.scale, pipe.width + 10 * this.scale, 20 * this.scale);

            // Bottom pipe
            ctx.fillStyle = isDark ? '#2d6a4f' : '#4CAF50';
            ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, this.canvas.height - pipe.bottomY);

            // Pipe cap (bottom)
            ctx.fillStyle = isDark ? '#40916c' : '#66BB6A';
            ctx.fillRect(pipe.x - 5 * this.scale, pipe.bottomY, pipe.width + 10 * this.scale, 20 * this.scale);
        }

        // Draw bird
        if (this.bird) {
            ctx.save();
            ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
            ctx.rotate(this.bird.rotation * Math.PI / 180);

            // Bird body
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bird eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.bird.width * 0.2, -this.bird.height * 0.1, this.bird.width * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.bird.width * 0.25, -this.bird.height * 0.1, this.bird.width * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Bird beak
            ctx.fillStyle = '#FF6B35';
            ctx.beginPath();
            ctx.moveTo(this.bird.width * 0.35, 0);
            ctx.lineTo(this.bird.width * 0.6, this.bird.height * 0.1);
            ctx.lineTo(this.bird.width * 0.35, this.bird.height * 0.2);
            ctx.closePath();
            ctx.fill();

            // Bird wing
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.ellipse(-this.bird.width * 0.1, this.bird.height * 0.1, this.bird.width * 0.2, this.bird.height * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        } else {
            // Draw static bird when game not started
            const birdX = this.canvas.width * 0.2;
            const birdY = this.canvas.height / 2;
            const birdWidth = 34 * this.scale;
            const birdHeight = 24 * this.scale;

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(birdX + birdWidth / 2, birdY + birdHeight / 2, birdWidth / 2, birdHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(birdX + birdWidth * 0.7, birdY + birdHeight * 0.4, birdWidth * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(birdX + birdWidth * 0.75, birdY + birdHeight * 0.4, birdWidth * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Beak
            ctx.fillStyle = '#FF6B35';
            ctx.beginPath();
            ctx.moveTo(birdX + birdWidth * 0.85, birdY + birdHeight * 0.5);
            ctx.lineTo(birdX + birdWidth * 1.1, birdY + birdHeight * 0.6);
            ctx.lineTo(birdX + birdWidth * 0.85, birdY + birdHeight * 0.7);
            ctx.closePath();
            ctx.fill();
        }
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
    game = new FlappyBird();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlappyBird };
}
