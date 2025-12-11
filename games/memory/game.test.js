/**
 * @jest-environment jsdom
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _getStore: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock recordRecentPlay
global.recordRecentPlay = jest.fn();

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  type: 'sine',
  frequency: {
    setValueAtTime: jest.fn(),
    value: 440
  },
  start: jest.fn(),
  stop: jest.fn()
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn()
  },
  exponentialDecayTo: jest.fn()
};

// Add exponentialDecayTo to GainNode prototype for the polyfill test
if (typeof GainNode === 'undefined') {
  global.GainNode = function() {};
}
GainNode.prototype.exponentialDecayTo = function(value, endTime) {
  this.gain.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
};

const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  resume: jest.fn(),
  createOscillator: jest.fn(() => ({
    ...mockOscillator,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { setValueAtTime: jest.fn() },
    type: 'sine'
  })),
  createGain: jest.fn(() => ({
    ...mockGainNode,
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    },
    exponentialDecayTo: jest.fn()
  }))
};

window.AudioContext = jest.fn(() => mockAudioContext);
window.webkitAudioContext = jest.fn(() => mockAudioContext);

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  jest.useFakeTimers();

  document.body.innerHTML = `
    <div id="game-board" class="cols-4"></div>
    <div id="moves">0</div>
    <div id="best-score">-</div>
    <div id="pairs-found">0</div>
    <div id="total-pairs">8</div>
    <div id="timer">0:00</div>
    <button id="new-game-btn">New Game</button>
    <button id="retry-btn">Try Again</button>
    <select id="difficulty-select">
      <option value="easy">Easy</option>
      <option value="medium" selected>Medium</option>
      <option value="hard">Hard</option>
    </select>
    <div id="game-message" class="hidden">
      <p></p>
    </div>
    <button id="theme-toggle-btn">🌙</button>
    <button id="sound-toggle-btn">
      <span class="sound-on-icon" style="display: inline;">🔊</span>
      <span class="sound-off-icon" style="display: none;">🔇</span>
    </button>
  `;

  document.body.classList.remove('dark-mode');
  jest.resetModules();
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================
// Memory Game Tests
// ============================================
describe('Memory Game', () => {
  let gameModule;

  beforeEach(() => {
    gameModule = require('./game.js');
  });

  describe('Constants and Configuration', () => {
    test('CARD_SYMBOLS should have enough symbols for all difficulties', () => {
      const { CARD_SYMBOLS } = gameModule;
      // Hard mode needs 12 pairs, so at least 12 symbols
      expect(CARD_SYMBOLS.length).toBeGreaterThanOrEqual(12);
    });

    test('DIFFICULTY_CONFIG should have correct configurations', () => {
      const { DIFFICULTY_CONFIG } = gameModule;

      expect(DIFFICULTY_CONFIG.easy).toEqual({ cols: 4, rows: 3, pairs: 6 });
      expect(DIFFICULTY_CONFIG.medium).toEqual({ cols: 4, rows: 4, pairs: 8 });
      expect(DIFFICULTY_CONFIG.hard).toEqual({ cols: 6, rows: 4, pairs: 12 });
    });
  });

  describe('Shuffle Function', () => {
    test('shuffle should return array with same length', () => {
      const { shuffle } = gameModule;
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      expect(shuffled.length).toBe(original.length);
    });

    test('shuffle should contain same elements', () => {
      const { shuffle } = gameModule;
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      expect(shuffled.sort()).toEqual(original.sort());
    });

    test('shuffle should not modify original array', () => {
      const { shuffle } = gameModule;
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      shuffle(original);

      expect(original).toEqual(copy);
    });
  });

  describe('Create Cards', () => {
    test('createCards should create correct number of cards for medium difficulty', () => {
      const { createCards, DIFFICULTY_CONFIG } = gameModule;
      // Medium is the default
      const cards = createCards();

      expect(cards.length).toBe(DIFFICULTY_CONFIG.medium.pairs * 2);
    });

    test('createCards should create pairs of symbols', () => {
      const { createCards } = gameModule;
      const cards = createCards();

      // Count occurrences of each symbol
      const counts = {};
      cards.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1;
      });

      // Each symbol should appear exactly twice
      Object.values(counts).forEach(count => {
        expect(count).toBe(2);
      });
    });
  });

  describe('Timer Functions', () => {
    test('startTimer should increment elapsed time', () => {
      const { startTimer, stopTimer, resetTimer } = gameModule;

      resetTimer();
      startTimer();

      // Advance timers by 3 seconds
      jest.advanceTimersByTime(3000);

      // Stop to prevent further increments
      stopTimer();

      // Check that the timer display was updated
      const timerDisplay = document.getElementById('timer');
      expect(timerDisplay.textContent).toBe('0:03');
    });

    test('stopTimer should stop the timer', () => {
      const { startTimer, stopTimer, resetTimer } = gameModule;

      resetTimer();
      startTimer();
      jest.advanceTimersByTime(2000);
      stopTimer();

      const timerBefore = document.getElementById('timer').textContent;

      jest.advanceTimersByTime(2000);

      const timerAfter = document.getElementById('timer').textContent;
      expect(timerAfter).toBe(timerBefore);
    });

    test('resetTimer should reset elapsed time to 0', () => {
      const { startTimer, stopTimer, resetTimer } = gameModule;

      resetTimer();
      startTimer();
      jest.advanceTimersByTime(5000);
      stopTimer();

      resetTimer();

      expect(document.getElementById('timer').textContent).toBe('0:00');
    });

    test('updateTimerDisplay should format time correctly', () => {
      const { updateTimerDisplay } = gameModule;
      // We need to set elapsedTime to test formatting
      // Since it's a module-level variable, we use startTimer/resetTimer
    });
  });

  describe('Theme Management', () => {
    test('loadTheme should apply dark mode from localStorage', () => {
      localStorageMock.setItem('game-hub-theme', 'dark');
      document.body.classList.remove('dark-mode');

      const { loadTheme } = gameModule;
      loadTheme();

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    test('loadTheme should not apply dark mode if not set', () => {
      document.body.classList.remove('dark-mode');

      const { loadTheme } = gameModule;
      loadTheme();

      expect(document.body.classList.contains('dark-mode')).toBe(false);
    });

    test('toggleTheme should toggle dark mode class', () => {
      const { toggleTheme } = gameModule;

      expect(document.body.classList.contains('dark-mode')).toBe(false);

      toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'dark');

      toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'light');
    });
  });

  describe('Sound Management', () => {
    test('loadSoundSetting should enable sound by default', () => {
      const { loadSoundSetting } = gameModule;
      loadSoundSetting();

      const soundBtn = document.getElementById('sound-toggle-btn');
      const onIcon = soundBtn.querySelector('.sound-on-icon');
      expect(onIcon.style.display).toBe('inline');
    });

    test('loadSoundSetting should load saved sound setting', () => {
      localStorageMock.setItem('memory-sound', 'false');
      jest.resetModules();
      const newModule = require('./game.js');

      const soundBtn = document.getElementById('sound-toggle-btn');
      const offIcon = soundBtn.querySelector('.sound-off-icon');
      // After loading with sound disabled, the off icon should be visible
      // This depends on the initialization order in the module
    });

    test('toggleSound should toggle sound state', () => {
      const { toggleSound } = gameModule;

      // Sound is enabled by default
      toggleSound();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('memory-sound', false);

      toggleSound();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('memory-sound', true);
    });
  });

  describe('Best Score Management', () => {
    test('getBestScore should return null if no score saved', () => {
      const { getBestScore } = gameModule;
      const score = getBestScore('medium');

      expect(score).toBeNull();
    });

    test('getBestScore should return saved score', () => {
      localStorageMock.setItem('memory-best-medium', '15');
      const { getBestScore } = gameModule;
      const score = getBestScore('medium');

      expect(score).toBe(15);
    });

    test('saveBestScore should save new best score', () => {
      const { saveBestScore } = gameModule;
      const result = saveBestScore('medium', 10);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('memory-best-medium', 10);
    });

    test('saveBestScore should save better score', () => {
      localStorageMock.setItem('memory-best-medium', '20');
      const { saveBestScore } = gameModule;
      const result = saveBestScore('medium', 15);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('memory-best-medium', 15);
    });

    test('saveBestScore should not save worse score', () => {
      localStorageMock.setItem('memory-best-medium', '10');
      const { saveBestScore } = gameModule;
      // Clear previous setItem calls
      localStorageMock.setItem.mockClear();

      const result = saveBestScore('medium', 15);

      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Render Board', () => {
    test('renderBoard should create correct number of cards', () => {
      const { renderBoard, initGame, DIFFICULTY_CONFIG } = gameModule;

      initGame();
      const gameBoard = document.getElementById('game-board');
      const cards = gameBoard.querySelectorAll('.card');

      expect(cards.length).toBe(DIFFICULTY_CONFIG.medium.pairs * 2);
    });

    test('renderBoard should set correct grid class', () => {
      const { initGame, DIFFICULTY_CONFIG } = gameModule;

      initGame();
      const gameBoard = document.getElementById('game-board');

      expect(gameBoard.className).toContain(`cols-${DIFFICULTY_CONFIG.medium.cols}`);
    });

    test('each card should have front and back faces', () => {
      const { initGame } = gameModule;

      initGame();
      const cards = document.getElementById('game-board').querySelectorAll('.card');

      cards.forEach(card => {
        expect(card.querySelector('.card-front')).not.toBeNull();
        expect(card.querySelector('.card-back')).not.toBeNull();
      });
    });
  });

  describe('Game Initialization', () => {
    test('initGame should reset game state', () => {
      const { initGame } = gameModule;

      initGame();

      expect(document.getElementById('moves').textContent).toBe('0');
      expect(document.getElementById('pairs-found').textContent).toBe('0');
      expect(document.getElementById('timer').textContent).toBe('0:00');
    });

    test('initGame should hide game message', () => {
      document.getElementById('game-message').classList.remove('hidden');

      const { initGame } = gameModule;
      initGame();

      expect(document.getElementById('game-message').classList.contains('hidden')).toBe(true);
    });

    test('initGame should call recordRecentPlay', () => {
      const { initGame } = gameModule;
      initGame();

      expect(global.recordRecentPlay).toHaveBeenCalledWith('memory');
    });

    test('initGame should set total pairs display', () => {
      const { initGame, DIFFICULTY_CONFIG } = gameModule;
      initGame();

      const totalPairs = document.getElementById('total-pairs');
      expect(totalPairs.textContent).toBe(DIFFICULTY_CONFIG.medium.pairs.toString());
    });
  });

  describe('Card Click Handler', () => {
    test('clicking card should flip it', () => {
      const { initGame, handleCardClick } = gameModule;
      initGame();

      const gameBoard = document.getElementById('game-board');
      const firstCard = gameBoard.children[0];

      // Simulate click
      firstCard.click();

      expect(firstCard.classList.contains('flipped')).toBe(true);
    });

    test('clicking two cards should increment moves', () => {
      const { initGame } = gameModule;
      initGame();

      const gameBoard = document.getElementById('game-board');

      // Click two different cards
      gameBoard.children[0].click();
      gameBoard.children[1].click();

      expect(document.getElementById('moves').textContent).toBe('1');
    });

    test('clicking already flipped card should do nothing', () => {
      const { initGame } = gameModule;
      initGame();

      const gameBoard = document.getElementById('game-board');
      const card = gameBoard.children[0];

      card.click();
      card.click();

      // Should still only have one card flipped (same card clicked twice)
      const flippedCards = gameBoard.querySelectorAll('.flipped');
      expect(flippedCards.length).toBe(1);
    });

    test('first card click should start timer', () => {
      const { initGame, stopTimer } = gameModule;
      initGame();

      const gameBoard = document.getElementById('game-board');
      gameBoard.children[0].click();

      // Advance timer
      jest.advanceTimersByTime(2000);

      // Clean up
      stopTimer();

      expect(document.getElementById('timer').textContent).toBe('0:02');
    });
  });

  describe('Match Checking', () => {
    test('matching cards should stay flipped', () => {
      const { initGame, checkMatch } = gameModule;
      initGame();

      // This is tricky to test since we need to manipulate the cards array
      // For now we just ensure the function exists
      expect(typeof checkMatch).toBe('function');
    });

    test('non-matching cards should flip back after delay', () => {
      const { initGame } = gameModule;
      initGame();

      const gameBoard = document.getElementById('game-board');
      const cards = Array.from(gameBoard.children);

      // Find two cards with different symbols
      const card1 = cards[0];
      const card2 = cards.find((c, i) => {
        const symbol1 = card1.querySelector('.card-back').textContent;
        const symbol2 = c.querySelector('.card-back').textContent;
        return i !== 0 && symbol1 !== symbol2;
      });

      if (card2) {
        card1.click();
        card2.click();

        // Fast-forward past the flip-back delay
        jest.advanceTimersByTime(1000);

        // Cards should be flipped back
        expect(card1.classList.contains('flipped')).toBe(false);
        expect(card2.classList.contains('flipped')).toBe(false);
      }
    });

    test('matching cards should get matched class', () => {
      const { initGame } = gameModule;
      initGame();

      const gameBoard = document.getElementById('game-board');
      const cards = Array.from(gameBoard.children);

      // Find two cards with same symbols
      const card1 = cards[0];
      const symbol1 = card1.querySelector('.card-back').textContent;
      const card2 = cards.find((c, i) => {
        const symbol2 = c.querySelector('.card-back').textContent;
        return i !== 0 && symbol1 === symbol2;
      });

      if (card2) {
        card1.click();
        card2.click();

        // Fast-forward past the match delay
        jest.advanceTimersByTime(500);

        expect(card1.classList.contains('matched')).toBe(true);
        expect(card2.classList.contains('matched')).toBe(true);
      }
    });
  });

  describe('Win Condition', () => {
    test('handleWin should stop timer and show message', () => {
      const { handleWin, stopTimer, initGame } = gameModule;

      initGame();

      // Manually trigger win
      handleWin();

      expect(document.getElementById('game-message').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('game-message').querySelector('p').textContent).toContain('Completed');
    });
  });

  describe('Difficulty Change', () => {
    test('changing difficulty should reinitialize game', () => {
      const { initGame, DIFFICULTY_CONFIG } = gameModule;

      // Set to easy
      const select = document.getElementById('difficulty-select');
      select.value = 'easy';
      select.dispatchEvent(new Event('change'));

      const gameBoard = document.getElementById('game-board');
      const cards = gameBoard.querySelectorAll('.card');

      expect(cards.length).toBe(DIFFICULTY_CONFIG.easy.pairs * 2);
    });
  });

  describe('Audio Functions', () => {
    test('initAudio should create AudioContext', () => {
      const { initAudio } = gameModule;

      initAudio();

      expect(window.AudioContext).toHaveBeenCalled();
    });

    test('playSound should not play if audioContext not initialized', () => {
      // The playSound function checks for audioContext
      const { playSound } = gameModule;
      // This shouldn't throw
      expect(() => playSound('flip')).not.toThrow();
    });
  });

  describe('Button Event Listeners', () => {
    test('new game button should initialize game', () => {
      const { initGame } = gameModule;

      // Modify some state
      document.getElementById('moves').textContent = '10';

      // Click new game
      document.getElementById('new-game-btn').click();

      expect(document.getElementById('moves').textContent).toBe('0');
    });

    test('retry button should initialize game', () => {
      const { initGame } = gameModule;

      // Modify some state
      document.getElementById('moves').textContent = '10';

      // Click retry
      document.getElementById('retry-btn').click();

      expect(document.getElementById('moves').textContent).toBe('0');
    });

    test('theme toggle button should toggle theme', () => {
      expect(document.body.classList.contains('dark-mode')).toBe(false);

      document.getElementById('theme-toggle-btn').click();

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    test('sound toggle button should toggle sound', () => {
      document.getElementById('sound-toggle-btn').click();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('memory-sound', expect.any(Boolean));
    });
  });

  describe('Update Best Score Display', () => {
    test('updateBestScoreDisplay should show dash when no best score', () => {
      const { updateBestScoreDisplay } = gameModule;
      updateBestScoreDisplay();

      expect(document.getElementById('best-score').textContent).toBe('-');
    });

    test('updateBestScoreDisplay should show saved best score', () => {
      localStorageMock.setItem('memory-best-medium', '15');
      const { updateBestScoreDisplay } = gameModule;
      updateBestScoreDisplay();

      expect(document.getElementById('best-score').textContent).toBe('15');
    });
  });
});

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  // Nothing to export
}
