class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        this.difficulty = 'easy';
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.minePositions = [];
        this.gameOver = false;
        this.gameWon = false;
        this.gameStarted = false;
        this.timer = 0;
        this.timerInterval = null;
        this.soundEnabled = true;
        this.longPressTimer = null;
        this.longPressTriggered = false;

        this.boardElement = document.getElementById('board');
        this.minesLeftElement = document.getElementById('mines-left');
        this.timerElement = document.getElementById('timer');
        this.gameMessageElement = document.getElementById('game-message');
        this.bestTimeElement = document.getElementById('best-time');

        this.initEventListeners();
        this.loadSettings();
        this.initGame();
    }

    initEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.initGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.initGame());
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.initGame();
        });

        document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
        document.getElementById('sound-toggle-btn').addEventListener('click', () => this.toggleSound());

        this.boardElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    loadSettings() {
        const savedTheme = localStorage.getItem('game-hub-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        const savedSound = localStorage.getItem('game-hub-sound');
        if (savedSound === 'off') {
            this.soundEnabled = false;
            document.getElementById('sound-toggle-btn').classList.add('sound-off');
            document.querySelector('.sound-on-icon').style.display = 'none';
            document.querySelector('.sound-off-icon').style.display = 'inline';
        }

        this.updateBestTime();
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('game-hub-sound', this.soundEnabled ? 'on' : 'off');

        const onIcon = document.querySelector('.sound-on-icon');
        const offIcon = document.querySelector('.sound-off-icon');

        if (this.soundEnabled) {
            onIcon.style.display = 'inline';
            offIcon.style.display = 'none';
        } else {
            onIcon.style.display = 'none';
            offIcon.style.display = 'inline';
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'reveal':
                oscillator.frequency.value = 600;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'flag':
                oscillator.frequency.value = 400;
                oscillator.type = 'triangle';
                gainNode.gain.value = 0.15;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'explosion':
                oscillator.frequency.value = 150;
                oscillator.type = 'sawtooth';
                gainNode.gain.value = 0.2;
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'win':
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gain.gain.value = 0.15;
                    osc.start(audioContext.currentTime + i * 0.15);
                    osc.stop(audioContext.currentTime + i * 0.15 + 0.15);
                });
                return;
        }
    }

    initGame() {
        const config = this.difficulties[this.difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;

        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.minePositions = [];
        this.gameOver = false;
        this.gameWon = false;
        this.gameStarted = false;

        this.stopTimer();
        this.timer = 0;
        this.timerElement.textContent = '0';
        this.minesLeftElement.textContent = this.totalMines;
        this.gameMessageElement.classList.add('hidden');

        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            this.revealed[r] = [];
            this.flagged[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = 0;
                this.revealed[r][c] = false;
                this.flagged[r][c] = false;
            }
        }

        this.renderBoard();
        this.updateBestTime();

        // Record this game as recently played
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('minesweeper');
        }
    }

    placeMines(firstRow, firstCol) {
        let minesPlaced = 0;

        while (minesPlaced < this.totalMines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            if (Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1) {
                continue;
            }

            if (this.board[r][c] !== -1) {
                this.board[r][c] = -1;
                this.minePositions.push({ row: r, col: c });
                minesPlaced++;
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] !== -1) {
                    this.board[r][c] = this.countAdjacentMines(r, c);
                }
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    if (this.board[nr][nc] === -1) count++;
                }
            }
        }
        return count;
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener('click', (e) => this.handleClick(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleFlag(r, c);
                });

                cell.addEventListener('touchstart', (e) => {
                    this.longPressTriggered = false;
                    this.longPressTimer = setTimeout(() => {
                        this.longPressTriggered = true;
                        this.toggleFlag(r, c);
                    }, 500);
                });

                cell.addEventListener('touchend', (e) => {
                    clearTimeout(this.longPressTimer);
                    if (this.longPressTriggered) {
                        e.preventDefault();
                    }
                });

                cell.addEventListener('touchmove', () => {
                    clearTimeout(this.longPressTimer);
                });

                this.boardElement.appendChild(cell);
            }
        }
    }

    handleClick(row, col) {
        if (this.gameOver || this.flagged[row][col] || this.revealed[row][col]) {
            return;
        }

        if (!this.gameStarted) {
            this.gameStarted = true;
            this.placeMines(row, col);
            this.startTimer();
        }

        this.revealCell(row, col);
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        if (this.revealed[row][col] || this.flagged[row][col]) return;

        this.revealed[row][col] = true;
        const cell = this.getCell(row, col);
        cell.classList.add('revealed');

        if (this.board[row][col] === -1) {
            cell.classList.add('mine-hit');
            cell.textContent = '💣';
            this.playSound('explosion');
            this.endGame(false);
            return;
        }

        this.playSound('reveal');

        if (this.board[row][col] > 0) {
            cell.textContent = this.board[row][col];
            cell.dataset.number = this.board[row][col];
        } else {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        this.revealCell(row + dr, col + dc);
                    }
                }
            }
        }

        this.checkWin();
    }

    toggleFlag(row, col) {
        if (this.gameOver || this.revealed[row][col]) return;

        const cell = this.getCell(row, col);
        this.flagged[row][col] = !this.flagged[row][col];

        if (this.flagged[row][col]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        } else {
            cell.classList.remove('flagged');
            cell.textContent = '';
        }

        this.playSound('flag');
        this.updateMinesLeft();
    }

    updateMinesLeft() {
        let flagCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.flagged[r][c]) flagCount++;
            }
        }
        this.minesLeftElement.textContent = this.totalMines - flagCount;
    }

    getCell(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    checkWin() {
        let revealedCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.revealed[r][c]) revealedCount++;
            }
        }

        if (revealedCount === this.rows * this.cols - this.totalMines) {
            this.endGame(true);
        }
    }

    endGame(won) {
        this.gameOver = true;
        this.gameWon = won;
        this.stopTimer();

        if (!won) {
            this.minePositions.forEach(({ row, col }) => {
                const cell = this.getCell(row, col);
                if (!this.flagged[row][col]) {
                    cell.classList.add('mine');
                    cell.classList.add('revealed');
                    cell.textContent = '💣';
                }
            });
        } else {
            this.playSound('win');
            this.saveBestTime();
        }

        const messageText = won ? `🎉 You Won! (${this.timer}s)` : '💥 Game Over!';
        this.gameMessageElement.querySelector('p').textContent = messageText;
        this.gameMessageElement.classList.remove('hidden');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    saveBestTime() {
        const key = `minesweeper-best-${this.difficulty}`;
        const currentBest = localStorage.getItem(key);

        if (!currentBest || this.timer < parseInt(currentBest)) {
            localStorage.setItem(key, this.timer);
            this.updateBestTime();
        }
    }

    updateBestTime() {
        const key = `minesweeper-best-${this.difficulty}`;
        const best = localStorage.getItem(key);
        this.bestTimeElement.textContent = best ? `${best}s (${this.difficulty})` : '-';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
