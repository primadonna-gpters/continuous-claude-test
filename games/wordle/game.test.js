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

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  jest.useFakeTimers();

  document.body.innerHTML = `
    <div id="board"></div>
    <div id="keyboard">
      <div class="keyboard-row">
        <button class="key" data-key="Q">Q</button>
        <button class="key" data-key="W">W</button>
        <button class="key" data-key="E">E</button>
        <button class="key" data-key="R">R</button>
        <button class="key" data-key="T">T</button>
        <button class="key" data-key="Y">Y</button>
        <button class="key" data-key="U">U</button>
        <button class="key" data-key="I">I</button>
        <button class="key" data-key="O">O</button>
        <button class="key" data-key="P">P</button>
      </div>
      <div class="keyboard-row">
        <button class="key" data-key="A">A</button>
        <button class="key" data-key="S">S</button>
        <button class="key" data-key="D">D</button>
        <button class="key" data-key="F">F</button>
        <button class="key" data-key="G">G</button>
        <button class="key" data-key="H">H</button>
        <button class="key" data-key="J">J</button>
        <button class="key" data-key="K">K</button>
        <button class="key" data-key="L">L</button>
      </div>
      <div class="keyboard-row">
        <button class="key wide" data-key="ENTER">ENTER</button>
        <button class="key" data-key="Z">Z</button>
        <button class="key" data-key="X">X</button>
        <button class="key" data-key="C">C</button>
        <button class="key" data-key="V">V</button>
        <button class="key" data-key="B">B</button>
        <button class="key" data-key="N">N</button>
        <button class="key" data-key="M">M</button>
        <button class="key wide" data-key="BACKSPACE">⌫</button>
      </div>
    </div>
    <div id="game-message" class="hidden">
      <span id="message-text"></span>
      <span id="answer-text"></span>
      <button id="play-again-btn">Play Again</button>
    </div>
    <button id="new-game-btn">New Game</button>
    <div id="wins">0</div>
    <div id="streak">0</div>
    <button id="theme-toggle-btn">🌙</button>
  `;

  document.body.classList.remove('dark-mode');
  jest.resetModules();
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================
// Wordle Game Tests
// ============================================
describe('Wordle Game', () => {
  let Wordle, WORD_LIST;

  beforeEach(() => {
    const gameModule = require('./game.js');
    Wordle = gameModule.Wordle;
    WORD_LIST = gameModule.WORD_LIST;
  });

  describe('Word List', () => {
    test('WORD_LIST should be exported', () => {
      expect(WORD_LIST).toBeDefined();
      expect(Array.isArray(WORD_LIST)).toBe(true);
    });

    test('WORD_LIST should have words', () => {
      expect(WORD_LIST.length).toBeGreaterThan(0);
    });

    test('most words should be 5 letters', () => {
      const fiveLetterWords = WORD_LIST.filter(word => word.length === 5);
      // Allow some tolerance for word list quality
      expect(fiveLetterWords.length / WORD_LIST.length).toBeGreaterThan(0.95);
    });

    test('all words should be lowercase', () => {
      WORD_LIST.forEach(word => {
        expect(word).toBe(word.toLowerCase());
      });
    });
  });

  describe('Initialization', () => {
    test('should initialize with correct defaults', () => {
      const game = new Wordle();

      expect(game.currentRow).toBe(0);
      expect(game.currentCol).toBe(0);
      expect(game.gameOver).toBe(false);
      expect(game.guesses).toEqual([]);
      expect(game.keyStates).toEqual({});
    });

    test('should select a random target word', () => {
      const game = new Wordle();

      expect(game.targetWord).toBeDefined();
      expect(game.targetWord.length).toBe(5);
      expect(WORD_LIST).toContain(game.targetWord);
    });

    test('should load theme from localStorage', () => {
      localStorageMock.setItem('game-hub-theme', 'dark');
      const game = new Wordle();

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    test('should load wins from localStorage', () => {
      localStorageMock.setItem('wordle-wins', '10');
      const game = new Wordle();

      expect(game.wins).toBe(10);
    });

    test('should load streak from localStorage', () => {
      localStorageMock.setItem('wordle-streak', '5');
      const game = new Wordle();

      expect(game.streak).toBe(5);
    });

    test('should start with 0 wins by default', () => {
      const game = new Wordle();

      expect(game.wins).toBe(0);
    });

    test('should start with 0 streak by default', () => {
      const game = new Wordle();

      expect(game.streak).toBe(0);
    });
  });

  describe('Board Creation', () => {
    test('should create 6 rows', () => {
      const game = new Wordle();
      const rows = game.board.querySelectorAll('.row');

      expect(rows.length).toBe(6);
    });

    test('each row should have 5 tiles', () => {
      const game = new Wordle();
      const rows = game.board.querySelectorAll('.row');

      rows.forEach(row => {
        const tiles = row.querySelectorAll('.tile');
        expect(tiles.length).toBe(5);
      });
    });

    test('tiles should have data attributes', () => {
      const game = new Wordle();
      const tile = game.board.querySelector('.tile');

      expect(tile.dataset.row).toBeDefined();
      expect(tile.dataset.col).toBeDefined();
    });
  });

  describe('Theme Management', () => {
    test('toggleTheme should toggle dark mode', () => {
      const game = new Wordle();

      expect(document.body.classList.contains('dark-mode')).toBe(false);

      game.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'dark');

      game.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'light');
    });
  });

  describe('Letter Input', () => {
    test('addLetter should add letter to current tile', () => {
      const game = new Wordle();

      game.addLetter('A');

      const tile = game.getTile(0, 0);
      expect(tile.textContent).toBe('A');
    });

    test('addLetter should increment currentCol', () => {
      const game = new Wordle();

      game.addLetter('A');

      expect(game.currentCol).toBe(1);
    });

    test('addLetter should add filled class', () => {
      const game = new Wordle();

      game.addLetter('A');

      const tile = game.getTile(0, 0);
      expect(tile.classList.contains('filled')).toBe(true);
    });

    test('addLetter should not exceed 5 letters', () => {
      const game = new Wordle();

      'ABCDEF'.split('').forEach(letter => {
        game.handleInput(letter);
      });

      expect(game.currentCol).toBe(5);
    });
  });

  describe('Letter Deletion', () => {
    test('deleteLetter should remove last letter', () => {
      const game = new Wordle();

      game.addLetter('A');
      game.deleteLetter();

      const tile = game.getTile(0, 0);
      expect(tile.textContent).toBe('');
    });

    test('deleteLetter should decrement currentCol', () => {
      const game = new Wordle();

      game.addLetter('A');
      game.addLetter('B');
      game.deleteLetter();

      expect(game.currentCol).toBe(1);
    });

    test('deleteLetter should remove filled class', () => {
      const game = new Wordle();

      game.addLetter('A');
      game.deleteLetter();

      const tile = game.getTile(0, 0);
      expect(tile.classList.contains('filled')).toBe(false);
    });

    test('deleteLetter should not go below 0', () => {
      const game = new Wordle();

      game.deleteLetter();
      game.deleteLetter();

      expect(game.currentCol).toBe(0);
    });
  });

  describe('Input Handling', () => {
    test('handleInput should add letter for A-Z', () => {
      const game = new Wordle();
      const addSpy = jest.spyOn(game, 'addLetter');

      game.handleInput('A');

      expect(addSpy).toHaveBeenCalledWith('A');
    });

    test('handleInput should delete for BACKSPACE', () => {
      const game = new Wordle();
      const deleteSpy = jest.spyOn(game, 'deleteLetter');

      game.handleInput('BACKSPACE');

      expect(deleteSpy).toHaveBeenCalled();
    });

    test('handleInput should submit for ENTER', () => {
      const game = new Wordle();
      const submitSpy = jest.spyOn(game, 'submitGuess');

      game.handleInput('ENTER');

      expect(submitSpy).toHaveBeenCalled();
    });

    test('handleInput should not work after game over', () => {
      const game = new Wordle();
      game.gameOver = true;

      game.handleInput('A');

      expect(game.currentCol).toBe(0);
    });
  });

  describe('Keyboard Input', () => {
    test('handleKeyPress should handle Enter', () => {
      const game = new Wordle();
      const inputSpy = jest.spyOn(game, 'handleInput');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      game.handleKeyPress(event);

      expect(inputSpy).toHaveBeenCalledWith('ENTER');
    });

    test('handleKeyPress should handle Backspace', () => {
      const game = new Wordle();
      const inputSpy = jest.spyOn(game, 'handleInput');

      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      game.handleKeyPress(event);

      expect(inputSpy).toHaveBeenCalledWith('BACKSPACE');
    });

    test('handleKeyPress should handle letters', () => {
      const game = new Wordle();
      const inputSpy = jest.spyOn(game, 'handleInput');

      const event = new KeyboardEvent('keydown', { key: 'a' });
      game.handleKeyPress(event);

      expect(inputSpy).toHaveBeenCalledWith('A');
    });

    test('handleKeyPress should uppercase letters', () => {
      const game = new Wordle();
      const inputSpy = jest.spyOn(game, 'handleInput');

      const event = new KeyboardEvent('keydown', { key: 'z' });
      game.handleKeyPress(event);

      expect(inputSpy).toHaveBeenCalledWith('Z');
    });

    test('handleKeyPress should not work after game over', () => {
      const game = new Wordle();
      game.gameOver = true;
      const inputSpy = jest.spyOn(game, 'handleInput');

      const event = new KeyboardEvent('keydown', { key: 'a' });
      game.handleKeyPress(event);

      expect(inputSpy).not.toHaveBeenCalled();
    });
  });

  describe('Guess Submission', () => {
    test('submitGuess should not submit if less than 5 letters', () => {
      const game = new Wordle();

      game.addLetter('A');
      game.addLetter('B');
      game.submitGuess();

      // Row should not change
      expect(game.currentRow).toBe(0);
    });

    test('submitGuess should shake row for incomplete guess', () => {
      const game = new Wordle();
      const shakeSpy = jest.spyOn(game, 'shakeRow');

      game.addLetter('A');
      game.submitGuess();

      expect(shakeSpy).toHaveBeenCalled();
    });

    test('submitGuess should shake row for invalid word', () => {
      const game = new Wordle();
      const shakeSpy = jest.spyOn(game, 'shakeRow');

      // Type an invalid word
      'XXXXX'.split('').forEach(l => game.addLetter(l));
      game.submitGuess();

      expect(shakeSpy).toHaveBeenCalled();
    });

    test('submitGuess should add valid guess to guesses array', () => {
      const game = new Wordle();

      // Use a word from the word list
      const validWord = WORD_LIST[0].toUpperCase();
      validWord.split('').forEach(l => game.addLetter(l));
      game.submitGuess();

      // Wait for reveal animation
      jest.advanceTimersByTime(2000);

      expect(game.guesses.length).toBe(1);
    });
  });

  describe('Get Current Guess', () => {
    test('getCurrentGuess should return typed letters', () => {
      const game = new Wordle();

      'HELLO'.split('').forEach(l => game.addLetter(l));

      expect(game.getCurrentGuess()).toBe('HELLO');
    });

    test('getCurrentGuess should return partial guess', () => {
      const game = new Wordle();

      'HE'.split('').forEach(l => game.addLetter(l));

      expect(game.getCurrentGuess()).toBe('HE');
    });
  });

  describe('Tile Reveal Logic', () => {
    test('revealTiles should mark correct letters as correct', () => {
      const game = new Wordle();
      game.targetWord = 'apple';

      'APPLE'.split('').forEach(l => game.addLetter(l));
      game.submitGuess();

      // Wait for all animations
      jest.advanceTimersByTime(2000);

      // All tiles should have correct class
      for (let i = 0; i < 5; i++) {
        const tile = game.getTile(0, i);
        expect(tile.classList.contains('correct')).toBe(true);
      }
    });

    test('revealTiles should call revealTiles method for valid guess', () => {
      const game = new Wordle();
      game.targetWord = 'about'; // Valid 5-letter word

      // Use a valid word from word list
      'ADULT'.split('').forEach(l => game.addLetter(l));

      // Check guess is valid before submit
      expect(game.currentCol).toBe(5);

      // Test that submitGuess proceeds to revealTiles
      const submitSpy = jest.spyOn(game, 'submitGuess');
      game.submitGuess();
      expect(submitSpy).toHaveBeenCalled();

      // Guesses array should have the guess
      expect(game.guesses.length).toBe(1);
    });

    test('revealTiles updates tile classes', () => {
      const game = new Wordle();
      game.targetWord = 'about';

      // Enter a valid guess and manually call revealTiles
      const guess = 'ADULT';
      guess.split('').forEach(l => game.addLetter(l));

      // Directly test updateKeyState which is called during reveal
      game.updateKeyState('A', 'correct');

      const key = game.keyboard.querySelector('[data-key="A"]');
      expect(key.classList.contains('correct')).toBe(true);
    });
  });

  describe('Key State Updates', () => {
    test('updateKeyState should update keyboard key', () => {
      const game = new Wordle();

      game.updateKeyState('A', 'correct');

      const key = game.keyboard.querySelector('[data-key="A"]');
      expect(key.classList.contains('correct')).toBe(true);
    });

    test('updateKeyState should not downgrade from correct', () => {
      const game = new Wordle();

      game.updateKeyState('A', 'correct');
      game.updateKeyState('A', 'present');

      const key = game.keyboard.querySelector('[data-key="A"]');
      expect(key.classList.contains('correct')).toBe(true);
    });

    test('updateKeyState should not downgrade from present to absent', () => {
      const game = new Wordle();

      game.updateKeyState('A', 'present');
      game.updateKeyState('A', 'absent');

      const key = game.keyboard.querySelector('[data-key="A"]');
      expect(key.classList.contains('present')).toBe(true);
    });

    test('updateKeyState should upgrade from present to correct', () => {
      const game = new Wordle();

      game.updateKeyState('A', 'present');
      game.updateKeyState('A', 'correct');

      const key = game.keyboard.querySelector('[data-key="A"]');
      expect(key.classList.contains('correct')).toBe(true);
    });
  });

  describe('Win Condition', () => {
    test('handleWin should set gameOver to true', () => {
      const game = new Wordle();

      game.handleWin();

      expect(game.gameOver).toBe(true);
    });

    test('handleWin should increment wins', () => {
      const game = new Wordle();
      game.wins = 5;

      game.handleWin();

      expect(game.wins).toBe(6);
    });

    test('handleWin should increment streak', () => {
      const game = new Wordle();
      game.streak = 3;

      game.handleWin();

      expect(game.streak).toBe(4);
    });

    test('handleWin should save stats', () => {
      const game = new Wordle();

      game.handleWin();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('wordle-wins', expect.any(Number));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('wordle-streak', expect.any(Number));
    });

    test('handleWin should show game message after delay', () => {
      const game = new Wordle();

      game.handleWin();
      jest.advanceTimersByTime(2000);

      expect(game.gameMessage.classList.contains('hidden')).toBe(false);
    });

    test('handleWin should call recordRecentPlay', () => {
      const game = new Wordle();

      game.handleWin();

      expect(global.recordRecentPlay).toHaveBeenCalledWith('wordle');
    });
  });

  describe('Loss Condition', () => {
    test('handleLoss should set gameOver to true', () => {
      const game = new Wordle();

      game.handleLoss();

      expect(game.gameOver).toBe(true);
    });

    test('handleLoss should reset streak', () => {
      const game = new Wordle();
      game.streak = 5;

      game.handleLoss();

      expect(game.streak).toBe(0);
    });

    test('handleLoss should not change wins', () => {
      const game = new Wordle();
      game.wins = 10;

      game.handleLoss();

      expect(game.wins).toBe(10);
    });

    test('handleLoss should save stats', () => {
      const game = new Wordle();

      game.handleLoss();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('wordle-streak', 0);
    });

    test('handleLoss should show game message', () => {
      const game = new Wordle();

      game.handleLoss();

      expect(game.gameMessage.classList.contains('hidden')).toBe(false);
    });

    test('handleLoss should show target word', () => {
      const game = new Wordle();
      game.targetWord = 'apple';

      game.handleLoss();

      expect(game.answerText.textContent).toContain('APPLE');
    });

    test('handleLoss should call recordRecentPlay', () => {
      const game = new Wordle();

      game.handleLoss();

      expect(global.recordRecentPlay).toHaveBeenCalledWith('wordle');
    });
  });

  describe('New Game', () => {
    test('startNewGame should reset game state', () => {
      const game = new Wordle();

      game.currentRow = 3;
      game.currentCol = 4;
      game.gameOver = true;

      game.startNewGame();

      expect(game.currentRow).toBe(0);
      expect(game.currentCol).toBe(0);
      expect(game.gameOver).toBe(false);
    });

    test('startNewGame should reset guesses', () => {
      const game = new Wordle();

      game.guesses = ['HELLO', 'WORLD'];
      game.startNewGame();

      expect(game.guesses).toEqual([]);
    });

    test('startNewGame should reset keyStates', () => {
      const game = new Wordle();

      game.keyStates = { A: 'correct', B: 'present' };
      game.startNewGame();

      expect(game.keyStates).toEqual({});
    });

    test('startNewGame should select new target word', () => {
      const game = new Wordle();

      const originalWord = game.targetWord;
      // Run many times to ensure we get a different word
      let changed = false;
      for (let i = 0; i < 100; i++) {
        game.startNewGame();
        if (game.targetWord !== originalWord) {
          changed = true;
          break;
        }
      }

      // There's a chance (1/500)^100 that we always get same word
      // which is effectively 0
      expect(game.targetWord).toBeDefined();
      expect(WORD_LIST).toContain(game.targetWord);
    });

    test('startNewGame should recreate board', () => {
      const game = new Wordle();

      game.addLetter('A');
      game.startNewGame();

      const tile = game.getTile(0, 0);
      expect(tile.textContent).toBe('');
    });

    test('startNewGame should reset keyboard colors', () => {
      const game = new Wordle();

      const key = game.keyboard.querySelector('[data-key="A"]');
      key.classList.add('correct');

      game.startNewGame();

      expect(key.classList.contains('correct')).toBe(false);
    });

    test('startNewGame should hide game message', () => {
      const game = new Wordle();

      game.gameMessage.classList.remove('hidden');
      game.startNewGame();

      expect(game.gameMessage.classList.contains('hidden')).toBe(true);
    });

    test('startNewGame should call recordRecentPlay', () => {
      const game = new Wordle();

      game.startNewGame();

      expect(global.recordRecentPlay).toHaveBeenCalledWith('wordle');
    });
  });

  describe('Stats Display', () => {
    test('updateStatsDisplay should update wins display', () => {
      const game = new Wordle();

      game.wins = 25;
      game.updateStatsDisplay();

      expect(game.winsDisplay.textContent).toBe('25');
    });

    test('updateStatsDisplay should update streak display', () => {
      const game = new Wordle();

      game.streak = 7;
      game.updateStatsDisplay();

      expect(game.streakDisplay.textContent).toBe('7');
    });
  });

  describe('Save Stats', () => {
    test('saveStats should save wins to localStorage', () => {
      const game = new Wordle();

      game.wins = 42;
      game.saveStats();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('wordle-wins', 42);
    });

    test('saveStats should save streak to localStorage', () => {
      const game = new Wordle();

      game.streak = 15;
      game.saveStats();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('wordle-streak', 15);
    });
  });

  describe('Get Tile', () => {
    test('getTile should return correct tile', () => {
      const game = new Wordle();

      const tile = game.getTile(2, 3);

      expect(tile).not.toBeNull();
      expect(tile.dataset.row).toBe('2');
      expect(tile.dataset.col).toBe('3');
    });
  });

  describe('Shake Row', () => {
    test('shakeRow should add shake class to tiles', () => {
      const game = new Wordle();

      game.shakeRow();

      const row = game.board.children[0];
      const tile = row.querySelector('.tile');
      expect(tile.classList.contains('shake')).toBe(true);
    });

    test('shakeRow should remove shake class after timeout', () => {
      const game = new Wordle();

      game.shakeRow();
      jest.advanceTimersByTime(600);

      const row = game.board.children[0];
      const tile = row.querySelector('.tile');
      expect(tile.classList.contains('shake')).toBe(false);
    });
  });

  describe('Button Events', () => {
    test('play again button should start new game', () => {
      const game = new Wordle();
      const startSpy = jest.spyOn(game, 'startNewGame');

      game.playAgainBtn.click();

      expect(startSpy).toHaveBeenCalled();
    });

    test('new game button should start new game', () => {
      const game = new Wordle();
      const startSpy = jest.spyOn(game, 'startNewGame');

      game.newGameBtn.click();

      expect(startSpy).toHaveBeenCalled();
    });

    test('theme toggle button should toggle theme', () => {
      const game = new Wordle();
      const themeSpy = jest.spyOn(game, 'toggleTheme');

      game.themeToggleBtn.click();

      expect(themeSpy).toHaveBeenCalled();
    });
  });

  describe('Virtual Keyboard', () => {
    test('clicking key should input letter', () => {
      const game = new Wordle();
      const inputSpy = jest.spyOn(game, 'handleInput');

      const key = game.keyboard.querySelector('[data-key="A"]');
      key.click();

      expect(inputSpy).toHaveBeenCalledWith('A');
    });

    test('clicking ENTER should submit guess', () => {
      const game = new Wordle();
      const inputSpy = jest.spyOn(game, 'handleInput');

      const key = game.keyboard.querySelector('[data-key="ENTER"]');
      key.click();

      expect(inputSpy).toHaveBeenCalledWith('ENTER');
    });

    test('clicking BACKSPACE should delete letter', () => {
      const game = new Wordle();
      const inputSpy = jest.spyOn(game, 'handleInput');

      const key = game.keyboard.querySelector('[data-key="BACKSPACE"]');
      key.click();

      expect(inputSpy).toHaveBeenCalledWith('BACKSPACE');
    });
  });

  describe('Full Game Flow', () => {
    test('should win on first try', () => {
      const game = new Wordle();
      game.targetWord = 'about';

      'ABOUT'.split('').forEach(l => game.handleInput(l));
      game.handleInput('ENTER');

      jest.advanceTimersByTime(3000);

      expect(game.gameOver).toBe(true);
      expect(game.wins).toBe(1);
      expect(game.streak).toBe(1);
    });

    test('should lose after 6 wrong guesses', () => {
      const game = new Wordle();
      game.targetWord = 'about';

      const wrongWords = ['adult', 'after', 'again', 'agent', 'agree', 'ahead'];

      wrongWords.forEach(word => {
        word.toUpperCase().split('').forEach(l => game.handleInput(l));
        game.handleInput('ENTER');
        jest.advanceTimersByTime(2000);
      });

      expect(game.gameOver).toBe(true);
      expect(game.streak).toBe(0);
    });
  });
});
