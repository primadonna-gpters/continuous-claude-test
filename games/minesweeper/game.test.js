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
    exponentialRampToValueAtTime: jest.fn(),
    value: 0.1
  }
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
    frequency: { setValueAtTime: jest.fn(), value: 440 },
    type: 'sine'
  })),
  createGain: jest.fn(() => ({
    ...mockGainNode,
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
      value: 0.1
    }
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
    <div id="board"></div>
    <div id="mines-left">10</div>
    <div id="timer">0</div>
    <div id="best-time">-</div>
    <button id="new-game-btn">New Game</button>
    <button id="retry-btn">Try Again</button>
    <select id="difficulty-select">
      <option value="easy" selected>Easy</option>
      <option value="medium">Medium</option>
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
// Minesweeper Tests
// ============================================
describe('Minesweeper', () => {
  let Minesweeper, game;

  beforeEach(() => {
    const gameModule = require('./game.js');
    Minesweeper = gameModule.Minesweeper;
  });

  describe('Initialization', () => {
    test('should initialize with default easy difficulty', () => {
      game = new Minesweeper();

      expect(game.difficulty).toBe('easy');
      expect(game.rows).toBe(9);
      expect(game.cols).toBe(9);
      expect(game.totalMines).toBe(10);
    });

    test('should initialize game state correctly', () => {
      game = new Minesweeper();

      expect(game.gameOver).toBe(false);
      expect(game.gameWon).toBe(false);
      expect(game.gameStarted).toBe(false);
      expect(game.timer).toBe(0);
    });

    test('should have correct difficulty configurations', () => {
      game = new Minesweeper();

      expect(game.difficulties.easy).toEqual({ rows: 9, cols: 9, mines: 10 });
      expect(game.difficulties.medium).toEqual({ rows: 16, cols: 16, mines: 40 });
      expect(game.difficulties.hard).toEqual({ rows: 16, cols: 30, mines: 99 });
    });

    test('should initialize board arrays with correct size', () => {
      game = new Minesweeper();

      expect(game.board.length).toBe(9);
      expect(game.board[0].length).toBe(9);
      expect(game.revealed.length).toBe(9);
      expect(game.flagged.length).toBe(9);
    });

    test('should render board with correct number of cells', () => {
      game = new Minesweeper();

      const cells = document.getElementById('board').querySelectorAll('.cell');
      expect(cells.length).toBe(81); // 9 * 9
    });

    test('should call recordRecentPlay on init', () => {
      game = new Minesweeper();

      expect(global.recordRecentPlay).toHaveBeenCalledWith('minesweeper');
    });
  });

  describe('Mine Placement', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('should place correct number of mines', () => {
      game.placeMines(4, 4);

      let mineCount = 0;
      for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
          if (game.board[r][c] === -1) mineCount++;
        }
      }

      expect(mineCount).toBe(game.totalMines);
    });

    test('should not place mine on first click position', () => {
      const firstRow = 4;
      const firstCol = 4;
      game.placeMines(firstRow, firstCol);

      // Check that there's no mine on or around the first click
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = firstRow + dr;
          const c = firstCol + dc;
          if (r >= 0 && r < game.rows && c >= 0 && c < game.cols) {
            expect(game.board[r][c]).not.toBe(-1);
          }
        }
      }
    });

    test('should calculate adjacent mine counts correctly', () => {
      game.placeMines(4, 4);

      for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
          if (game.board[r][c] !== -1) {
            const expected = game.countAdjacentMines(r, c);
            expect(game.board[r][c]).toBe(expected);
          }
        }
      }
    });
  });

  describe('Count Adjacent Mines', () => {
    beforeEach(() => {
      game = new Minesweeper();
      // Set up a known board state
      game.board = [
        [-1, 0, 0],
        [0, 0, 0],
        [0, 0, -1]
      ];
      game.rows = 3;
      game.cols = 3;
    });

    test('should count adjacent mines correctly', () => {
      expect(game.countAdjacentMines(1, 1)).toBe(2); // Center cell with 2 adjacent mines
      expect(game.countAdjacentMines(0, 1)).toBe(1); // Next to one mine
      expect(game.countAdjacentMines(0, 2)).toBe(0); // No adjacent mines
    });

    test('should handle corner cells', () => {
      // Bottom-left corner - only has 3 adjacent cells, none are mines
      expect(game.countAdjacentMines(2, 0)).toBe(0);
    });

    test('should handle edge cells', () => {
      expect(game.countAdjacentMines(1, 0)).toBe(1); // Left edge
    });
  });

  describe('Cell Reveal', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('should reveal cell on click', () => {
      game.handleClick(4, 4);

      expect(game.revealed[4][4]).toBe(true);
    });

    test('first click should place mines and start timer', () => {
      expect(game.gameStarted).toBe(false);

      game.handleClick(4, 4);

      expect(game.gameStarted).toBe(true);
      expect(game.minePositions.length).toBe(game.totalMines);
    });

    test('should not reveal flagged cell', () => {
      game.flagged[4][4] = true;
      game.handleClick(4, 4);

      expect(game.revealed[4][4]).toBe(false);
    });

    test('should not reveal already revealed cell', () => {
      game.handleClick(4, 4);
      const initialBoard = JSON.stringify(game.board);

      game.handleClick(4, 4);
      const afterBoard = JSON.stringify(game.board);

      expect(initialBoard).toBe(afterBoard);
    });

    test('revealing mine should end game', () => {
      // Manually place a mine
      game.gameStarted = true;
      game.board[0][0] = -1;
      game.minePositions.push({ row: 0, col: 0 });

      game.revealCell(0, 0);

      expect(game.gameOver).toBe(true);
      expect(game.gameWon).toBe(false);
    });

    test('should cascade reveal on empty cell', () => {
      // Create a board with some empty cells
      game.gameStarted = true;
      game.rows = 3;
      game.cols = 3;
      game.board = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      game.revealed = [
        [false, false, false],
        [false, false, false],
        [false, false, false]
      ];
      game.flagged = [
        [false, false, false],
        [false, false, false],
        [false, false, false]
      ];
      game.minePositions = [];
      game.totalMines = 0;

      // Mock getCell to return a valid element
      const mockCell = document.createElement('div');
      mockCell.classList.add('cell');
      game.getCell = jest.fn(() => mockCell);

      game.revealCell(1, 1);

      // All cells should be revealed due to cascade
      let revealedCount = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (game.revealed[r][c]) revealedCount++;
        }
      }

      expect(revealedCount).toBe(9);
    });
  });

  describe('Flagging', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('should toggle flag on cell', () => {
      expect(game.flagged[4][4]).toBe(false);

      game.toggleFlag(4, 4);
      expect(game.flagged[4][4]).toBe(true);

      game.toggleFlag(4, 4);
      expect(game.flagged[4][4]).toBe(false);
    });

    test('should not flag revealed cell', () => {
      game.revealed[4][4] = true;
      game.toggleFlag(4, 4);

      expect(game.flagged[4][4]).toBe(false);
    });

    test('should not flag when game is over', () => {
      game.gameOver = true;
      game.toggleFlag(4, 4);

      expect(game.flagged[4][4]).toBe(false);
    });

    test('should update mines left count', () => {
      game.toggleFlag(0, 0);
      game.toggleFlag(0, 1);

      expect(document.getElementById('mines-left').textContent).toBe('8');

      game.toggleFlag(0, 0);

      expect(document.getElementById('mines-left').textContent).toBe('9');
    });
  });

  describe('Win Condition', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('should win when all non-mine cells revealed', () => {
      // Set up a simple 2x2 board with 1 mine
      game.rows = 2;
      game.cols = 2;
      game.totalMines = 1;
      game.board = [
        [-1, 1],
        [1, 1]
      ];
      game.revealed = [
        [false, false],
        [false, false]
      ];
      game.flagged = [
        [false, false],
        [false, false]
      ];
      game.minePositions = [{ row: 0, col: 0 }];
      game.gameStarted = true;
      game.timerInterval = setInterval(() => {}, 1000);

      // Mock getCell
      const mockCell = document.createElement('div');
      mockCell.classList.add('cell');
      game.getCell = jest.fn(() => mockCell);

      // Reveal all non-mine cells
      game.revealCell(0, 1);
      game.revealCell(1, 0);
      game.revealCell(1, 1);

      expect(game.gameWon).toBe(true);
      expect(game.gameOver).toBe(true);
    });
  });

  describe('Timer', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('startTimer should increment timer', () => {
      game.startTimer();

      jest.advanceTimersByTime(3000);
      game.stopTimer();

      expect(game.timer).toBe(3);
    });

    test('stopTimer should stop the timer', () => {
      game.startTimer();
      jest.advanceTimersByTime(2000);
      game.stopTimer();

      const timerBefore = game.timer;
      jest.advanceTimersByTime(2000);

      expect(game.timer).toBe(timerBefore);
    });
  });

  describe('Theme', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('loadSettings should apply dark mode from localStorage', () => {
      localStorageMock.setItem('game-hub-theme', 'dark');
      document.body.classList.remove('dark-mode');

      game.loadSettings();

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    test('toggleTheme should toggle dark mode', () => {
      expect(document.body.classList.contains('dark-mode')).toBe(false);

      game.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'dark');

      game.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'light');
    });
  });

  describe('Sound', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('sound should be enabled by default', () => {
      expect(game.soundEnabled).toBe(true);
    });

    test('loadSettings should load sound setting', () => {
      localStorageMock.setItem('game-hub-sound', 'off');
      jest.resetModules();
      const newGame = new (require('./game.js').Minesweeper)();

      expect(newGame.soundEnabled).toBe(false);
    });

    test('toggleSound should toggle sound state', () => {
      expect(game.soundEnabled).toBe(true);

      game.toggleSound();
      expect(game.soundEnabled).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-sound', 'off');

      game.toggleSound();
      expect(game.soundEnabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-sound', 'on');
    });

    test('playSound should not play when disabled', () => {
      game.soundEnabled = false;
      const audioContextSpy = jest.spyOn(window, 'AudioContext');

      game.playSound('reveal');

      expect(audioContextSpy).not.toHaveBeenCalled();
    });

    test('playSound should create AudioContext when enabled', () => {
      game.soundEnabled = true;
      game.playSound('reveal');

      expect(window.AudioContext).toHaveBeenCalled();
    });
  });

  describe('Best Time', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('saveBestTime should save new best time', () => {
      game.timer = 100;
      game.saveBestTime();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('minesweeper-best-easy', 100);
    });

    test('saveBestTime should save better time', () => {
      localStorageMock.setItem('minesweeper-best-easy', '200');
      game.timer = 150;
      game.saveBestTime();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('minesweeper-best-easy', 150);
    });

    test('saveBestTime should not save worse time', () => {
      localStorageMock.setItem('minesweeper-best-easy', '100');
      localStorageMock.setItem.mockClear();
      game.timer = 150;
      game.saveBestTime();

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    test('updateBestTime should display best time', () => {
      localStorageMock.setItem('minesweeper-best-easy', '120');
      game.updateBestTime();

      expect(document.getElementById('best-time').textContent).toBe('120s (easy)');
    });

    test('updateBestTime should display dash when no best time', () => {
      game.updateBestTime();

      expect(document.getElementById('best-time').textContent).toBe('-');
    });
  });

  describe('Difficulty Change', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('changing difficulty should reinitialize game', () => {
      const select = document.getElementById('difficulty-select');
      select.value = 'medium';
      select.dispatchEvent(new Event('change'));

      expect(game.difficulty).toBe('medium');
      expect(game.rows).toBe(16);
      expect(game.cols).toBe(16);
      expect(game.totalMines).toBe(40);
    });
  });

  describe('New Game and Retry', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('new game button should reset game', () => {
      game.gameOver = true;
      game.score = 100;

      document.getElementById('new-game-btn').click();

      expect(game.gameOver).toBe(false);
      expect(game.timer).toBe(0);
    });

    test('retry button should reset game', () => {
      game.gameOver = true;

      document.getElementById('retry-btn').click();

      expect(game.gameOver).toBe(false);
    });
  });

  describe('Game End', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('endGame with loss should show all mines', () => {
      game.gameStarted = true;
      game.minePositions = [{ row: 0, col: 0 }];
      game.board[0][0] = -1;
      game.timerInterval = setInterval(() => {}, 1000);

      game.endGame(false);

      expect(game.gameOver).toBe(true);
      expect(game.gameWon).toBe(false);
      expect(document.getElementById('game-message').classList.contains('hidden')).toBe(false);
    });

    test('endGame with win should save best time', () => {
      game.gameStarted = true;
      game.timer = 50;
      game.timerInterval = setInterval(() => {}, 1000);

      game.endGame(true);

      expect(game.gameWon).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('minesweeper-best-easy', 50);
    });
  });

  describe('Get Cell', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('getCell should return correct cell element', () => {
      const cell = game.getCell(0, 0);

      expect(cell).not.toBeNull();
      expect(cell.dataset.row).toBe('0');
      expect(cell.dataset.col).toBe('0');
    });
  });

  describe('Render Board', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('renderBoard should set correct grid columns', () => {
      game.renderBoard();

      const board = document.getElementById('board');
      expect(board.style.gridTemplateColumns).toBe('repeat(9, 1fr)');
    });

    test('each cell should have click handler', () => {
      game.renderBoard();

      const cell = document.querySelector('.cell');
      const clickSpy = jest.spyOn(game, 'handleClick');

      cell.click();

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Long Press (Mobile)', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('long press should trigger flag', () => {
      const cell = game.getCell(4, 4);

      // Simulate touchstart
      const touchStartEvent = new Event('touchstart');
      cell.dispatchEvent(touchStartEvent);

      // Advance past long press threshold
      jest.advanceTimersByTime(600);

      expect(game.longPressTriggered).toBe(true);
      expect(game.flagged[4][4]).toBe(true);
    });

    test('touchend before threshold should not flag', () => {
      const cell = game.getCell(4, 4);

      const touchStartEvent = new Event('touchstart');
      cell.dispatchEvent(touchStartEvent);

      jest.advanceTimersByTime(400);

      const touchEndEvent = new Event('touchend');
      cell.dispatchEvent(touchEndEvent);

      expect(game.flagged[4][4]).toBe(false);
    });

    test('touchmove should cancel long press', () => {
      const cell = game.getCell(4, 4);

      const touchStartEvent = new Event('touchstart');
      cell.dispatchEvent(touchStartEvent);

      jest.advanceTimersByTime(200);

      const touchMoveEvent = new Event('touchmove');
      cell.dispatchEvent(touchMoveEvent);

      jest.advanceTimersByTime(400);

      expect(game.flagged[4][4]).toBe(false);
    });
  });

  describe('Context Menu', () => {
    beforeEach(() => {
      game = new Minesweeper();
    });

    test('right click should toggle flag', () => {
      const cell = game.getCell(4, 4);
      const preventDefaultSpy = jest.fn();

      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true
      });
      contextMenuEvent.preventDefault = preventDefaultSpy;

      cell.dispatchEvent(contextMenuEvent);

      expect(game.flagged[4][4]).toBe(true);
    });
  });
});

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  // Nothing to export
}
