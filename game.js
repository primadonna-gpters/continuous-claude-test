class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.won = false;
        this.over = false;
        this.keepPlaying = false;

        this.tileContainer = document.getElementById('tile-container');
        this.gridBackground = document.getElementById('grid-background');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = this.gameMessage.querySelector('p');
        this.retryButton = document.getElementById('retry-btn');
        this.keepPlayingButton = document.getElementById('keep-playing-btn');
        this.newGameButton = document.getElementById('new-game-btn');

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

        this.updateScore();
        this.hideMessage();
        this.addRandomTile();
        this.addRandomTile();
        this.render();
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
                value,
                row,
                col,
                isNew: true,
                merged: false
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

        // Clear merge flags
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col]) {
                    this.grid[row][col].merged = false;
                    this.grid[row][col].isNew = false;
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
                        this.grid[next.row][next.col] = {
                            value: newValue,
                            row: next.row,
                            col: next.col,
                            merged: true,
                            isNew: false
                        };
                        this.grid[row][col] = null;
                        this.score += newValue;
                        moved = true;

                        if (newValue === 2048 && !this.keepPlaying) {
                            this.won = true;
                        }
                    } else if (farthest.row !== row || farthest.col !== col) {
                        // Move tile
                        this.grid[farthest.row][farthest.col] = {
                            ...tile,
                            row: farthest.row,
                            col: farthest.col
                        };
                        this.grid[row][col] = null;
                        moved = true;
                    }
                }
            }
        }

        if (moved) {
            this.addRandomTile();
            this.updateScore();

            if (!this.movesAvailable()) {
                this.over = true;
            }

            this.render();

            if (this.won) {
                this.showMessage('You Win!', 'game-won');
            } else if (this.over) {
                this.showMessage('Game Over!', 'game-over');
            }
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
        this.tileContainer.innerHTML = '';

        const containerRect = this.tileContainer.getBoundingClientRect();
        const gap = window.innerWidth <= 520 ? 8 : 12;
        const cellSize = (containerRect.width - gap * (this.size - 1)) / this.size;

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    const tileElement = document.createElement('div');
                    const tileClass = tile.value <= 2048 ? `tile-${tile.value}` : 'tile-super';
                    tileElement.className = `tile ${tileClass}`;

                    if (tile.isNew) {
                        tileElement.classList.add('tile-new');
                    }
                    if (tile.merged) {
                        tileElement.classList.add('tile-merged');
                    }

                    tileElement.textContent = tile.value;
                    tileElement.style.width = `${cellSize}px`;
                    tileElement.style.height = `${cellSize}px`;
                    tileElement.style.left = `${col * (cellSize + gap)}px`;
                    tileElement.style.top = `${row * (cellSize + gap)}px`;

                    this.tileContainer.appendChild(tileElement);
                }
            }
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
        const savedTheme = localStorage.getItem('2048-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('2048-theme', isDark ? 'dark' : 'light');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new Game2048();
});

// Handle window resize for proper tile sizing
window.addEventListener('resize', () => {
    if (window.game2048) {
        window.game2048.render();
    }
});
