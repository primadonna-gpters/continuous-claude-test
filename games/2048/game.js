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
        const saved = localStorage.getItem('2048-sound');
        return saved !== 'false';
    }

    saveSoundPreference() {
        localStorage.setItem('2048-sound', this.enabled.toString());
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
        this.playTone(220, 0.1, 'sine', 0.15);
    }

    playMerge(value) {
        // Higher pitch for higher value tiles
        const baseFreq = 330;
        const multiplier = Math.min(Math.log2(value) / 11, 1);
        const freq = baseFreq + (multiplier * 440);
        this.playTone(freq, 0.15, 'sine', 0.25);
    }

    playNewTile() {
        this.playTone(523, 0.08, 'sine', 0.1);
    }

    playWin() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6 (C major chord arpeggio)
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.3), i * 100);
        });
    }

    playGameOver() {
        if (!this.enabled) return;
        this.initAudioContext();

        const notes = [392, 349, 330, 262]; // G4, F4, E4, C4 (descending)
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.2), i * 150);
        });
    }

    playUndo() {
        this.playTone(392, 0.1, 'triangle', 0.15);
    }
}

class Game2048 {
    constructor(soundManager) {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.won = false;
        this.over = false;
        this.keepPlaying = false;
        this.previousState = null;
        this.tileId = 0;
        this.tileElements = new Map();
        this.soundManager = soundManager;

        this.tileContainer = document.getElementById('tile-container');
        this.gridBackground = document.getElementById('grid-background');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = this.gameMessage.querySelector('p');
        this.retryButton = document.getElementById('retry-btn');
        this.keepPlayingButton = document.getElementById('keep-playing-btn');
        this.newGameButton = document.getElementById('new-game-btn');
        this.undoButton = document.getElementById('undo-btn');

        this.initGridBackground();
        this.bindEvents();
        this.init();
    }

    initGridBackground() {
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            this.gridBackground.appendChild(cell);
        }
    }

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.newGameButton.addEventListener('click', () => this.init());
        this.retryButton.addEventListener('click', () => this.init());
        this.keepPlayingButton.addEventListener('click', () => this.continueGame());
        this.undoButton.addEventListener('click', () => this.undo());

        // Touch events for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: true });
    }

    handleKeyDown(event) {
        if (this.over && !this.keepPlaying) return;
        if (this.won && !this.keepPlaying) return;

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

        const direction = keyMap[event.key];
        if (direction) {
            event.preventDefault();
            this.move(direction);
        }

        if (event.key === 'z' || event.key === 'Z') {
            event.preventDefault();
            this.undo();
        }
    }

    handleSwipe(startX, startY, endX, endY) {
        if (this.over && !this.keepPlaying) return;
        if (this.won && !this.keepPlaying) return;

        const dx = endX - startX;
        const dy = endY - startY;
        const minSwipeDistance = 50;

        if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            this.move(dx > 0 ? 'right' : 'left');
        } else {
            this.move(dy > 0 ? 'down' : 'up');
        }
    }

    init() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        this.score = 0;
        this.won = false;
        this.over = false;
        this.keepPlaying = false;
        this.previousState = null;
        this.tileId = 0;
        this.clearTileElements();

        this.updateScore();
        this.updateUndoButton();
        this.hideMessage();
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    clearTileElements() {
        this.tileElements.forEach((element) => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.tileElements.clear();
        this.tileContainer.innerHTML = '';
    }

    generateTileId() {
        return ++this.tileId;
    }

    saveState() {
        this.previousState = {
            grid: this.grid.map(row => row.map(tile => tile ? { ...tile } : null)),
            score: this.score,
            won: this.won,
            over: this.over
        };
        this.updateUndoButton();
    }

    undo() {
        if (!this.previousState) return;

        this.soundManager.playUndo();

        // Restore grid with new IDs to prevent animation artifacts
        this.grid = this.previousState.grid.map(row => row.map(tile => {
            if (tile) {
                return {
                    ...tile,
                    id: this.generateTileId(),
                    previousPosition: null,
                    mergedFrom: null,
                    isNew: false,
                    merged: false
                };
            }
            return null;
        }));
        this.score = this.previousState.score;
        this.won = this.previousState.won;
        this.over = this.previousState.over;
        this.previousState = null;

        // Clear existing tile elements for clean render
        this.clearTileElements();

        this.updateScore();
        this.updateUndoButton();
        this.hideMessage();
        this.render();
    }

    updateUndoButton() {
        if (this.previousState) {
            this.undoButton.classList.remove('disabled');
            this.undoButton.disabled = false;
        } else {
            this.undoButton.classList.add('disabled');
            this.undoButton.disabled = true;
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === null) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[row][col] = {
                id: this.generateTileId(),
                value,
                row,
                col,
                isNew: true,
                merged: false,
                previousPosition: null,
                mergedFrom: null
            };
        }
    }

    move(direction) {
        const vectors = {
            'up': { row: -1, col: 0 },
            'down': { row: 1, col: 0 },
            'left': { row: 0, col: -1 },
            'right': { row: 0, col: 1 }
        };

        const vector = vectors[direction];
        let moved = false;

        // Save state before move for undo
        this.saveState();

        // Clear merge flags and store previous positions
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col]) {
                    this.grid[row][col].merged = false;
                    this.grid[row][col].isNew = false;
                    this.grid[row][col].mergedFrom = null;
                    this.grid[row][col].previousPosition = { row, col };
                }
            }
        }

        // Build traversal order
        const traversals = this.buildTraversals(vector);

        for (const row of traversals.rows) {
            for (const col of traversals.cols) {
                const tile = this.grid[row][col];
                if (tile) {
                    const { farthest, next } = this.findFarthestPosition(row, col, vector);

                    if (next && this.grid[next.row][next.col] &&
                        this.grid[next.row][next.col].value === tile.value &&
                        !this.grid[next.row][next.col].merged) {
                        // Merge tiles
                        const newValue = tile.value * 2;
                        const targetTile = this.grid[next.row][next.col];
                        this.grid[next.row][next.col] = {
                            id: this.generateTileId(),
                            value: newValue,
                            row: next.row,
                            col: next.col,
                            merged: true,
                            isNew: false,
                            previousPosition: null,
                            mergedFrom: [
                                { ...tile, previousPosition: tile.previousPosition },
                                { ...targetTile, previousPosition: targetTile.previousPosition }
                            ]
                        };
                        this.grid[row][col] = null;
                        this.score += newValue;
                        moved = true;
                        this.soundManager.playMerge(newValue);

                        if (newValue === 2048 && !this.keepPlaying) {
                            this.won = true;
                        }
                    } else if (farthest.row !== row || farthest.col !== col) {
                        // Move tile
                        this.grid[farthest.row][farthest.col] = {
                            ...tile,
                            row: farthest.row,
                            col: farthest.col,
                            previousPosition: tile.previousPosition
                        };
                        this.grid[row][col] = null;
                        moved = true;
                    }
                }
            }
        }

        if (moved) {
            this.addRandomTile();
            this.soundManager.playNewTile();
            this.updateScore();

            if (!this.movesAvailable()) {
                this.over = true;
            }

            this.render();

            if (this.won) {
                this.showMessage('You Win!', 'game-won');
                this.soundManager.playWin();
            } else if (this.over) {
                this.showMessage('Game Over!', 'game-over');
                this.soundManager.playGameOver();
            }
        } else {
            // No move happened, discard the saved state
            this.previousState = null;
            this.updateUndoButton();
        }
    }

    buildTraversals(vector) {
        const traversals = {
            rows: [],
            cols: []
        };

        for (let i = 0; i < this.size; i++) {
            traversals.rows.push(i);
            traversals.cols.push(i);
        }

        if (vector.row === 1) traversals.rows.reverse();
        if (vector.col === 1) traversals.cols.reverse();

        return traversals;
    }

    findFarthestPosition(row, col, vector) {
        let previous;
        let current = { row, col };

        do {
            previous = current;
            current = {
                row: previous.row + vector.row,
                col: previous.col + vector.col
            };
        } while (this.isWithinBounds(current) && !this.grid[current.row][current.col]);

        return {
            farthest: previous,
            next: this.isWithinBounds(current) ? current : null
        };
    }

    isWithinBounds(position) {
        return position.row >= 0 && position.row < this.size &&
               position.col >= 0 && position.col < this.size;
    }

    movesAvailable() {
        // Check for empty cells
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === null) {
                    return true;
                }
            }
        }

        // Check for adjacent matching tiles
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    const directions = [
                        { row: 0, col: 1 },
                        { row: 1, col: 0 }
                    ];

                    for (const dir of directions) {
                        const nextRow = row + dir.row;
                        const nextCol = col + dir.col;

                        if (this.isWithinBounds({ row: nextRow, col: nextCol })) {
                            const nextTile = this.grid[nextRow][nextCol];
                            if (nextTile && nextTile.value === tile.value) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    render() {
        const containerRect = this.tileContainer.getBoundingClientRect();
        const gap = window.innerWidth <= 520 ? 8 : 12;
        const cellSize = (containerRect.width - gap * (this.size - 1)) / this.size;

        // Track which tiles we've rendered
        const renderedTileIds = new Set();

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    renderedTileIds.add(tile.id);

                    // Handle merged tiles - animate both source tiles to the merge position
                    if (tile.mergedFrom) {
                        for (const mergedTile of tile.mergedFrom) {
                            this.renderMovingTile(mergedTile, tile.row, tile.col, cellSize, gap, true);
                        }
                    }

                    // Render the tile itself
                    this.renderTile(tile, cellSize, gap);
                }
            }
        }

        // Remove tile elements that are no longer in the grid
        const toRemove = [];
        this.tileElements.forEach((element, id) => {
            if (!renderedTileIds.has(id)) {
                toRemove.push(id);
            }
        });
        for (const id of toRemove) {
            const element = this.tileElements.get(id);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.tileElements.delete(id);
        }
    }

    renderTile(tile, cellSize, gap) {
        let tileElement = this.tileElements.get(tile.id);
        const isNewElement = !tileElement;

        if (isNewElement) {
            tileElement = document.createElement('div');
            tileElement.className = 'tile';
            this.tileContainer.appendChild(tileElement);
            this.tileElements.set(tile.id, tileElement);
        }

        // Update tile class based on value
        const tileClass = tile.value <= 2048 ? `tile-${tile.value}` : 'tile-super';
        tileElement.className = `tile ${tileClass}`;

        // Handle animations
        if (tile.isNew) {
            tileElement.classList.add('tile-new');
        }
        if (tile.merged) {
            tileElement.classList.add('tile-merged');
        }

        tileElement.textContent = tile.value;
        tileElement.style.width = `${cellSize}px`;
        tileElement.style.height = `${cellSize}px`;

        // If tile has a previous position and is not new, start from previous position
        if (tile.previousPosition && !tile.isNew) {
            const prevLeft = tile.previousPosition.col * (cellSize + gap);
            const prevTop = tile.previousPosition.row * (cellSize + gap);
            const newLeft = tile.col * (cellSize + gap);
            const newTop = tile.row * (cellSize + gap);

            // Set to previous position first (without transition)
            if (isNewElement || (prevLeft !== newLeft || prevTop !== newTop)) {
                tileElement.style.transition = 'none';
                tileElement.style.left = `${prevLeft}px`;
                tileElement.style.top = `${prevTop}px`;

                // Force reflow to ensure the transition works
                tileElement.offsetHeight;

                // Enable transition and move to new position
                tileElement.style.transition = '';
                tileElement.style.left = `${newLeft}px`;
                tileElement.style.top = `${newTop}px`;
            }
        } else {
            // New tile or no previous position - just set position
            tileElement.style.left = `${tile.col * (cellSize + gap)}px`;
            tileElement.style.top = `${tile.row * (cellSize + gap)}px`;
        }
    }

    renderMovingTile(tile, targetRow, targetCol, cellSize, gap, willBeRemoved) {
        let tileElement = this.tileElements.get(tile.id);

        if (!tileElement) {
            // Create temporary element for animation
            tileElement = document.createElement('div');
            tileElement.className = 'tile';
            this.tileContainer.appendChild(tileElement);
        }

        const tileClass = tile.value <= 2048 ? `tile-${tile.value}` : 'tile-super';
        tileElement.className = `tile ${tileClass}`;
        tileElement.textContent = tile.value;
        tileElement.style.width = `${cellSize}px`;
        tileElement.style.height = `${cellSize}px`;

        // Start from previous position
        if (tile.previousPosition) {
            const prevLeft = tile.previousPosition.col * (cellSize + gap);
            const prevTop = tile.previousPosition.row * (cellSize + gap);

            tileElement.style.transition = 'none';
            tileElement.style.left = `${prevLeft}px`;
            tileElement.style.top = `${prevTop}px`;

            // Force reflow
            tileElement.offsetHeight;

            // Animate to target position
            tileElement.style.transition = '';
            tileElement.style.left = `${targetCol * (cellSize + gap)}px`;
            tileElement.style.top = `${targetRow * (cellSize + gap)}px`;
        }

        // Remove after animation if needed
        if (willBeRemoved) {
            this.tileElements.delete(tile.id);
            setTimeout(() => {
                if (tileElement.parentNode) {
                    tileElement.parentNode.removeChild(tileElement);
                }
            }, 150); // Match CSS transition duration
        }
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        this.bestScoreDisplay.textContent = this.bestScore;
    }

    showMessage(message, className) {
        this.messageText.textContent = message;
        this.gameMessage.classList.remove('hidden', 'game-won', 'game-over');
        this.gameMessage.classList.add(className);

        if (this.won && !this.over) {
            this.keepPlayingButton.classList.remove('hidden');
        } else {
            this.keepPlayingButton.classList.add('hidden');
        }
    }

    hideMessage() {
        this.gameMessage.classList.add('hidden');
    }

    continueGame() {
        this.keepPlaying = true;
        this.hideMessage();
    }

    loadBestScore() {
        const saved = localStorage.getItem('2048-best-score');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveBestScore() {
        localStorage.setItem('2048-best-score', this.bestScore.toString());
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
    }
}

// Initialize game when DOM is loaded
let game2048Instance = null;
let soundManagerInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    soundManagerInstance = new SoundManager();
    game2048Instance = new Game2048(soundManagerInstance);

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

// Handle window resize for proper tile sizing
window.addEventListener('resize', () => {
    if (game2048Instance) {
        game2048Instance.render();
    }
});
