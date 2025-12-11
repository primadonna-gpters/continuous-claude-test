// Memory Game - Card Matching Game

const CARD_SYMBOLS = [
    '🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🫐', '🥝',
    '🌸', '🌺', '🌻', '🌹', '🌷', '🪻', '🌼', '💐',
    '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁'
];

const DIFFICULTY_CONFIG = {
    easy: { cols: 4, rows: 3, pairs: 6 },
    medium: { cols: 4, rows: 4, pairs: 8 },
    hard: { cols: 6, rows: 4, pairs: 12 }
};

// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;
let gameStarted = false;
let timerInterval = null;
let elapsedTime = 0;
let currentDifficulty = 'medium';

// Sound state
let soundEnabled = true;

// Audio context for sound effects
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'flip':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.exponentialDecayTo(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'match':
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.exponentialDecayTo(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'nomatch':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.exponentialDecayTo(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'win':
            const playNote = (freq, startTime, duration) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(freq, startTime);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, startTime);
                gain.exponentialDecayTo(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            const now = audioContext.currentTime;
            playNote(523, now, 0.15);
            playNote(659, now + 0.15, 0.15);
            playNote(784, now + 0.3, 0.15);
            playNote(1047, now + 0.45, 0.3);
            return;
    }
}

// Polyfill for exponentialDecayTo
if (!GainNode.prototype.exponentialDecayTo) {
    GainNode.prototype.exponentialDecayTo = function(value, endTime) {
        this.gain.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
    };
}

// DOM Elements
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const bestScoreDisplay = document.getElementById('best-score');
const pairsFoundDisplay = document.getElementById('pairs-found');
const totalPairsDisplay = document.getElementById('total-pairs');
const timerDisplay = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const retryBtn = document.getElementById('retry-btn');
const difficultySelect = document.getElementById('difficulty-select');
const gameMessage = document.getElementById('game-message');
const gameMessageText = gameMessage.querySelector('p');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');

// Theme management
const THEME_KEY = 'game-hub-theme';

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

// Sound management
function loadSoundSetting() {
    const saved = localStorage.getItem('memory-sound');
    if (saved !== null) {
        soundEnabled = saved === 'true';
    }
    updateSoundButton();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('memory-sound', soundEnabled);
    updateSoundButton();
}

function updateSoundButton() {
    const onIcon = soundToggleBtn.querySelector('.sound-on-icon');
    const offIcon = soundToggleBtn.querySelector('.sound-off-icon');
    if (soundEnabled) {
        onIcon.style.display = 'inline';
        offIcon.style.display = 'none';
    } else {
        onIcon.style.display = 'none';
        offIcon.style.display = 'inline';
    }
}

// Best score management
function getBestScore(difficulty) {
    const saved = localStorage.getItem(`memory-best-${difficulty}`);
    return saved ? parseInt(saved) : null;
}

function saveBestScore(difficulty, score) {
    const best = getBestScore(difficulty);
    if (best === null || score < best) {
        localStorage.setItem(`memory-best-${difficulty}`, score);
        return true;
    }
    return false;
}

function updateBestScoreDisplay() {
    const best = getBestScore(currentDifficulty);
    bestScoreDisplay.textContent = best !== null ? best : '-';
}

// Timer functions
function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        elapsedTime++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Shuffle array using Fisher-Yates algorithm
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Create game cards
function createCards() {
    const config = DIFFICULTY_CONFIG[currentDifficulty];
    const selectedSymbols = shuffle(CARD_SYMBOLS).slice(0, config.pairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];
    return shuffle(cardPairs);
}

// Render the game board
function renderBoard() {
    const config = DIFFICULTY_CONFIG[currentDifficulty];
    gameBoard.innerHTML = '';
    gameBoard.className = `cols-${config.cols}`;

    cards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.innerHTML = `
            <div class="card-face card-front"></div>
            <div class="card-face card-back">${symbol}</div>
        `;
        card.addEventListener('click', () => handleCardClick(index));
        gameBoard.appendChild(card);
    });
}

// Handle card click
function handleCardClick(index) {
    if (isLocked) return;

    const cardElement = gameBoard.children[index];

    // Ignore if already flipped or matched
    if (cardElement.classList.contains('flipped') ||
        cardElement.classList.contains('matched')) {
        return;
    }

    // Initialize audio on first interaction
    initAudio();

    // Start timer on first move
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    // Flip the card
    cardElement.classList.add('flipped');
    flippedCards.push(index);
    playSound('flip');

    // Check for match when two cards are flipped
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkMatch();
    }
}

// Check if two flipped cards match
function checkMatch() {
    isLocked = true;
    const [index1, index2] = flippedCards;
    const card1 = gameBoard.children[index1];
    const card2 = gameBoard.children[index2];

    if (cards[index1] === cards[index2]) {
        // Match found
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            pairsFoundDisplay.textContent = matchedPairs;
            playSound('match');

            flippedCards = [];
            isLocked = false;

            // Check for win
            if (matchedPairs === DIFFICULTY_CONFIG[currentDifficulty].pairs) {
                handleWin();
            }
        }, 300);
    } else {
        // No match
        setTimeout(() => {
            playSound('nomatch');
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 800);
    }
}

// Handle win
function handleWin() {
    stopTimer();
    playSound('win');

    const isNewBest = saveBestScore(currentDifficulty, moves);
    updateBestScoreDisplay();

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    let message = `🎉 Completed!\n${moves} moves in ${timeStr}`;
    if (isNewBest) {
        message += '\n🏆 New Best!';
    }

    gameMessageText.textContent = message;
    gameMessage.classList.remove('hidden');
}

// Initialize new game
function initGame() {
    // Reset state
    cards = createCards();
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    gameStarted = false;

    // Reset displays
    movesDisplay.textContent = '0';
    pairsFoundDisplay.textContent = '0';
    totalPairsDisplay.textContent = DIFFICULTY_CONFIG[currentDifficulty].pairs;
    resetTimer();
    updateBestScoreDisplay();

    // Hide message and render board
    gameMessage.classList.add('hidden');
    renderBoard();

    // Record this game as recently played
    if (typeof recordRecentPlay === 'function') {
        recordRecentPlay('memory');
    }
}

// Event listeners
newGameBtn.addEventListener('click', () => {
    initAudio();
    initGame();
});

retryBtn.addEventListener('click', () => {
    initAudio();
    initGame();
});

difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    initGame();
});

themeToggleBtn.addEventListener('click', toggleTheme);
soundToggleBtn.addEventListener('click', toggleSound);

// Initialize
loadTheme();
loadSoundSetting();
initGame();

// Export for testing (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CARD_SYMBOLS,
        DIFFICULTY_CONFIG,
        shuffle,
        createCards,
        renderBoard,
        handleCardClick,
        checkMatch,
        handleWin,
        initGame,
        startTimer,
        stopTimer,
        resetTimer,
        updateTimerDisplay,
        loadTheme,
        toggleTheme,
        loadSoundSetting,
        toggleSound,
        updateSoundButton,
        getBestScore,
        saveBestScore,
        updateBestScoreDisplay,
        initAudio,
        playSound
    };
}
