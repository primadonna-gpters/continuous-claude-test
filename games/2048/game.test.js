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

// Mock matchMedia
const mockMatchMedia = (matches = false) => {
  return jest.fn().mockImplementation(query => ({
    matches: matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia(false),
});

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  type: 'sine',
  frequency: {
    setValueAtTime: jest.fn()
  },
  start: jest.fn(),
  stop: jest.fn()
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn()
  }
};

const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  resume: jest.fn(),
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode)
};

window.AudioContext = jest.fn(() => mockAudioContext);
window.webkitAudioContext = jest.fn(() => mockAudioContext);

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  jest.useFakeTimers();

  window.matchMedia = mockMatchMedia(false);

  // Reset AudioContext mock
  mockAudioContext.state = 'running';
  window.AudioContext.mockClear();

  document.body.innerHTML = `
    <div class="game-container">
      <button id="theme-toggle-btn"></button>
      <button id="sound-toggle-btn">
        <span class="sound-on-icon"></span>
        <span class="sound-off-icon"></span>
      </button>
      <div id="score">0</div>
      <div id="best-score">0</div>
      <div id="grid-background"></div>
      <div id="tile-container"></div>
      <div id="game-message" class="hidden">
        <p></p>
        <button id="retry-btn">Try Again</button>
        <button id="keep-playing-btn" class="hidden">Keep Playing</button>
      </div>
      <button id="new-game-btn">New Game</button>
      <button id="undo-btn" class="disabled" disabled>Undo</button>
    </div>
  `;
  document.body.classList.remove('dark-mode');

  jest.resetModules();
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================
// SoundManager Tests
// ============================================
describe('SoundManager', () => {
  let SoundManager;

  beforeEach(() => {
    const gameModule = require('./game.js');
    SoundManager = gameModule.SoundManager;
  });

  test('should load sound preference from localStorage (enabled by default)', () => {
    const soundManager = new SoundManager();
    expect(soundManager.enabled).toBe(true);
  });

  test('should load sound preference from localStorage (disabled)', () => {
    localStorageMock.setItem('2048-sound', 'false');
    const soundManager = new SoundManager();
    expect(soundManager.enabled).toBe(false);
  });

  test('should toggle sound and save preference', () => {
    const soundManager = new SoundManager();
    expect(soundManager.enabled).toBe(true);

    const result = soundManager.toggle();

    expect(result).toBe(false);
    expect(soundManager.enabled).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('2048-sound', 'false');
  });

  test('should toggle sound back on', () => {
    localStorageMock.setItem('2048-sound', 'false');
    const soundManager = new SoundManager();

    const result = soundManager.toggle();

    expect(result).toBe(true);
    expect(soundManager.enabled).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('2048-sound', 'true');
  });

  test('should initialize AudioContext when playing tone', () => {
    const soundManager = new SoundManager();
    soundManager.playTone(440, 0.1);

    expect(window.AudioContext).toHaveBeenCalled();
    expect(mockOscillator.connect).toHaveBeenCalled();
    expect(mockGainNode.connect).toHaveBeenCalled();
  });

  test('should resume AudioContext if suspended', () => {
    mockAudioContext.state = 'suspended';
    const soundManager = new SoundManager();
    soundManager.playTone(440, 0.1);

    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  test('should not play tone when disabled', () => {
    localStorageMock.setItem('2048-sound', 'false');
    const soundManager = new SoundManager();
    soundManager.playTone(440, 0.1);

    expect(window.AudioContext).not.toHaveBeenCalled();
  });

  test('playMove should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playMove();

    expect(spy).toHaveBeenCalledWith(220, 0.1, 'sine', 0.15);
  });

  test('playMerge should call playTone with value-based frequency', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playMerge(4);

    expect(spy).toHaveBeenCalled();
    const [freq, duration, type, volume] = spy.mock.calls[0];
    expect(freq).toBeGreaterThan(330);
    expect(duration).toBe(0.15);
    expect(type).toBe('sine');
    expect(volume).toBe(0.25);
  });

  test('playNewTile should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playNewTile();

    expect(spy).toHaveBeenCalledWith(523, 0.08, 'sine', 0.1);
  });

  test('playWin should play multiple notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playWin();

    jest.advanceTimersByTime(500);

    expect(spy).toHaveBeenCalledTimes(4);
  });

  test('playWin should not play when disabled', () => {
    localStorageMock.setItem('2048-sound', 'false');
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playWin();

    jest.advanceTimersByTime(500);

    expect(spy).not.toHaveBeenCalled();
  });

  test('playGameOver should play descending notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playGameOver();

    jest.advanceTimersByTime(700);

    expect(spy).toHaveBeenCalledTimes(4);
  });

  test('playUndo should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playUndo();

    expect(spy).toHaveBeenCalledWith(392, 0.1, 'triangle', 0.15);
  });
});

// ============================================
// Game2048 Core Logic Tests
// ============================================
describe('Game2048', () => {
  let Game2048, SoundManager;

  beforeEach(() => {
    const gameModule = require('./game.js');
    SoundManager = gameModule.SoundManager;
    Game2048 = gameModule.Game2048;
  });

  describe('Initialization', () => {
    test('should initialize with 4x4 grid', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      expect(game.size).toBe(4);
      expect(game.grid.length).toBe(4);
      expect(game.grid[0].length).toBe(4);
    });

    test('should start with score 0', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      expect(game.score).toBe(0);
    });

    test('should start with 2 tiles', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      let tileCount = 0;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (game.grid[row][col] !== null) {
            tileCount++;
          }
        }
      }

      expect(tileCount).toBe(2);
    });

    test('should load best score from localStorage', () => {
      localStorageMock.setItem('2048-best-score', '1000');
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      expect(game.bestScore).toBe(1000);
    });

    test('should create grid background cells', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      const gridBackground = document.getElementById('grid-background');
      expect(gridBackground.querySelectorAll('.grid-cell').length).toBe(16);
    });
  });

  describe('Tile Generation', () => {
    test('should generate unique tile IDs', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      const id1 = game.generateTileId();
      const id2 = game.generateTileId();

      expect(id1).not.toBe(id2);
    });

    test('addRandomTile should add a tile with value 2 or 4', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Clear grid first
      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.addRandomTile();

      let foundTile = null;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (game.grid[row][col]) {
            foundTile = game.grid[row][col];
            break;
          }
        }
        if (foundTile) break;
      }

      expect(foundTile).not.toBeNull();
      expect([2, 4]).toContain(foundTile.value);
    });

    test('addRandomTile should not add when grid is full', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Fill the grid
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          game.grid[row][col] = { id: game.generateTileId(), value: 2, row, col };
        }
      }

      const gridBefore = JSON.stringify(game.grid);
      game.addRandomTile();
      const gridAfter = JSON.stringify(game.grid);

      // Grid should be unchanged in structure
      expect(gridAfter).toBe(gridBefore);
    });
  });

  describe('Movement and Merging', () => {
    test('buildTraversals should return correct order for left', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      const traversals = game.buildTraversals({ row: 0, col: -1 });

      expect(traversals.rows).toEqual([0, 1, 2, 3]);
      expect(traversals.cols).toEqual([0, 1, 2, 3]);
    });

    test('buildTraversals should return correct order for right', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      const traversals = game.buildTraversals({ row: 0, col: 1 });

      expect(traversals.rows).toEqual([0, 1, 2, 3]);
      expect(traversals.cols).toEqual([3, 2, 1, 0]);
    });

    test('buildTraversals should return correct order for up', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      const traversals = game.buildTraversals({ row: -1, col: 0 });

      expect(traversals.rows).toEqual([0, 1, 2, 3]);
      expect(traversals.cols).toEqual([0, 1, 2, 3]);
    });

    test('buildTraversals should return correct order for down', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      const traversals = game.buildTraversals({ row: 1, col: 0 });

      expect(traversals.rows).toEqual([3, 2, 1, 0]);
      expect(traversals.cols).toEqual([0, 1, 2, 3]);
    });

    test('isWithinBounds should return true for valid positions', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      expect(game.isWithinBounds({ row: 0, col: 0 })).toBe(true);
      expect(game.isWithinBounds({ row: 3, col: 3 })).toBe(true);
      expect(game.isWithinBounds({ row: 2, col: 1 })).toBe(true);
    });

    test('isWithinBounds should return false for invalid positions', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      expect(game.isWithinBounds({ row: -1, col: 0 })).toBe(false);
      expect(game.isWithinBounds({ row: 4, col: 0 })).toBe(false);
      expect(game.isWithinBounds({ row: 0, col: -1 })).toBe(false);
      expect(game.isWithinBounds({ row: 0, col: 4 })).toBe(false);
    });

    test('findFarthestPosition should find empty cells', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Clear grid
      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      // Add one tile at (0, 3)
      game.grid[0][3] = { id: 1, value: 2, row: 0, col: 3 };

      const result = game.findFarthestPosition(0, 3, { row: 0, col: -1 });

      expect(result.farthest).toEqual({ row: 0, col: 0 });
      expect(result.next).toBeNull();
    });

    test('findFarthestPosition should stop at other tiles', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Clear grid
      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      // Add tiles
      game.grid[0][0] = { id: 1, value: 2, row: 0, col: 0 };
      game.grid[0][3] = { id: 2, value: 2, row: 0, col: 3 };

      const result = game.findFarthestPosition(0, 3, { row: 0, col: -1 });

      expect(result.farthest).toEqual({ row: 0, col: 1 });
      expect(result.next).toEqual({ row: 0, col: 0 });
    });

    test('move should merge same value tiles', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Set up a simple merge scenario
      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.grid[0][0] = { id: 1, value: 2, row: 0, col: 0, merged: false };
      game.grid[0][1] = { id: 2, value: 2, row: 0, col: 1, merged: false };

      game.move('left');

      // After merge, we should have a 4 at (0, 0)
      expect(game.grid[0][0].value).toBe(4);
      expect(game.score).toBe(4);
    });

    test('move should not merge already merged tiles', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Set up: [2, 2, 2, 2] -> should become [4, 4, null, null]
      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.grid[0][0] = { id: 1, value: 2, row: 0, col: 0, merged: false };
      game.grid[0][1] = { id: 2, value: 2, row: 0, col: 1, merged: false };
      game.grid[0][2] = { id: 3, value: 2, row: 0, col: 2, merged: false };
      game.grid[0][3] = { id: 4, value: 2, row: 0, col: 3, merged: false };

      game.move('left');

      // Should have two 4s, not one 8
      expect(game.grid[0][0].value).toBe(4);
      expect(game.grid[0][1].value).toBe(4);
      expect(game.score).toBe(8);
    });

    test('move should update score on merge', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.grid[0][0] = { id: 1, value: 4, row: 0, col: 0, merged: false };
      game.grid[0][1] = { id: 2, value: 4, row: 0, col: 1, merged: false };
      game.score = 0;

      game.move('left');

      expect(game.score).toBe(8);
    });
  });

  describe('Game State', () => {
    test('movesAvailable should return true when empty cells exist', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.grid[0][0] = { id: 1, value: 2, row: 0, col: 0 };

      expect(game.movesAvailable()).toBe(true);
    });

    test('movesAvailable should return true when mergeable tiles exist', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Fill grid with values that can merge
      game.grid = Array(4).fill(null).map((_, row) =>
        Array(4).fill(null).map((__, col) => ({
          id: row * 4 + col,
          value: 2,
          row,
          col
        }))
      );

      expect(game.movesAvailable()).toBe(true);
    });

    test('movesAvailable should return false when no moves possible', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      // Fill grid with unique values - checkerboard pattern
      game.grid = Array(4).fill(null).map((_, row) =>
        Array(4).fill(null).map((__, col) => ({
          id: row * 4 + col,
          value: (row + col) % 2 === 0 ? 2 : 4,
          row,
          col
        }))
      );

      expect(game.movesAvailable()).toBe(false);
    });

    test('should detect win at 2048', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.grid[0][0] = { id: 1, value: 1024, row: 0, col: 0, merged: false };
      game.grid[0][1] = { id: 2, value: 1024, row: 0, col: 1, merged: false };

      game.move('left');

      expect(game.won).toBe(true);
    });

    test('continueGame should allow playing past 2048', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.won = true;
      game.continueGame();

      expect(game.keepPlaying).toBe(true);
    });
  });

  describe('Undo Functionality', () => {
    test('saveState should preserve grid state', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.grid[0][0] = { id: 1, value: 2, row: 0, col: 0 };
      game.score = 100;

      game.saveState();

      expect(game.previousState).not.toBeNull();
      expect(game.previousState.score).toBe(100);
      expect(game.previousState.grid[0][0].value).toBe(2);
    });

    test('undo should restore previous state', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.grid = Array(4).fill(null).map(() => Array(4).fill(null));
      game.grid[0][0] = { id: 1, value: 2, row: 0, col: 0, merged: false };
      game.grid[0][1] = { id: 2, value: 2, row: 0, col: 1, merged: false };
      game.score = 0;

      game.move('left'); // Will merge into 4
      expect(game.score).toBe(4);

      game.undo();

      expect(game.score).toBe(0);
    });

    test('undo should do nothing if no previous state', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.previousState = null;
      const scoreBefore = game.score;

      game.undo();

      expect(game.score).toBe(scoreBefore);
    });

    test('undo button should be disabled when no previous state', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.previousState = null;
      game.updateUndoButton();

      const undoBtn = document.getElementById('undo-btn');
      expect(undoBtn.disabled).toBe(true);
      expect(undoBtn.classList.contains('disabled')).toBe(true);
    });

    test('undo button should be enabled when previous state exists', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.saveState();
      game.updateUndoButton();

      const undoBtn = document.getElementById('undo-btn');
      expect(undoBtn.disabled).toBe(false);
      expect(undoBtn.classList.contains('disabled')).toBe(false);
    });
  });

  describe('Score Management', () => {
    test('should save best score to localStorage', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.score = 5000;
      game.bestScore = 1000;
      game.updateScore();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('2048-best-score', '5000');
    });

    test('should not save if score is not higher than best', () => {
      localStorageMock.setItem('2048-best-score', '10000');
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      localStorageMock.setItem.mockClear();

      game.score = 500;
      game.updateScore();

      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('2048-best-score', expect.any(String));
    });
  });

  describe('Message Display', () => {
    test('showMessage should display game over message', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.showMessage('Game Over!', 'game-over');

      const gameMessage = document.getElementById('game-message');
      expect(gameMessage.classList.contains('hidden')).toBe(false);
      expect(gameMessage.classList.contains('game-over')).toBe(true);
      expect(gameMessage.querySelector('p').textContent).toBe('Game Over!');
    });

    test('showMessage should show keep playing button on win', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.won = true;
      game.over = false;
      game.showMessage('You Win!', 'game-won');

      const keepPlayingBtn = document.getElementById('keep-playing-btn');
      expect(keepPlayingBtn.classList.contains('hidden')).toBe(false);
    });

    test('hideMessage should hide the game message', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);

      game.showMessage('Test', 'game-over');
      game.hideMessage();

      const gameMessage = document.getElementById('game-message');
      expect(gameMessage.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Keyboard Input', () => {
    test('handleKeyDown should process arrow keys', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      game.handleKeyDown(event);

      expect(moveSpy).toHaveBeenCalledWith('up');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test('handleKeyDown should process WASD keys', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      const event = new KeyboardEvent('keydown', { key: 'w' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      game.handleKeyDown(event);

      expect(moveSpy).toHaveBeenCalledWith('up');
    });

    test('handleKeyDown should process Z for undo', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const undoSpy = jest.spyOn(game, 'undo');

      const event = new KeyboardEvent('keydown', { key: 'z' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      game.handleKeyDown(event);

      expect(undoSpy).toHaveBeenCalled();
    });

    test('handleKeyDown should not process when game is over', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.over = true;
      game.keepPlaying = false;

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      game.handleKeyDown(event);

      expect(moveSpy).not.toHaveBeenCalled();
    });

    test('handleKeyDown should work when keepPlaying is true', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.won = true;
      game.keepPlaying = true;

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      game.handleKeyDown(event);

      expect(moveSpy).toHaveBeenCalled();
    });
  });

  describe('Touch Input', () => {
    test('handleSwipe should detect horizontal swipe right', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.handleSwipe(0, 0, 100, 10);

      expect(moveSpy).toHaveBeenCalledWith('right');
    });

    test('handleSwipe should detect horizontal swipe left', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.handleSwipe(100, 0, 0, 10);

      expect(moveSpy).toHaveBeenCalledWith('left');
    });

    test('handleSwipe should detect vertical swipe down', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.handleSwipe(0, 0, 10, 100);

      expect(moveSpy).toHaveBeenCalledWith('down');
    });

    test('handleSwipe should detect vertical swipe up', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.handleSwipe(0, 100, 10, 0);

      expect(moveSpy).toHaveBeenCalledWith('up');
    });

    test('handleSwipe should ignore small swipes', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.handleSwipe(0, 0, 20, 20);

      expect(moveSpy).not.toHaveBeenCalled();
    });

    test('handleSwipe should not work when game is over', () => {
      const soundManager = new SoundManager();
      const game = new Game2048(soundManager);
      const moveSpy = jest.spyOn(game, 'move');

      game.over = true;
      game.keepPlaying = false;

      game.handleSwipe(0, 0, 100, 0);

      expect(moveSpy).not.toHaveBeenCalled();
    });
  });
});

// ============================================
// ThemeManager Tests
// ============================================
describe('ThemeManager', () => {
  let ThemeManager;

  beforeEach(() => {
    const gameModule = require('./game.js');
    ThemeManager = gameModule.ThemeManager;
  });

  test('should load dark theme from localStorage', () => {
    localStorageMock.setItem('game-hub-theme', 'dark');

    const manager = new ThemeManager();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  test('should load light theme from localStorage', () => {
    localStorageMock.setItem('game-hub-theme', 'light');
    document.body.classList.remove('dark-mode');

    const manager = new ThemeManager();

    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  test('should respect system preference for dark mode', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const manager = new ThemeManager();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  test('should toggle theme on button click', () => {
    document.body.classList.remove('dark-mode');

    const manager = new ThemeManager();
    const btn = document.getElementById('theme-toggle-btn');

    btn.click();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'dark');
  });

  test('should toggle theme off when dark', () => {
    document.body.classList.add('dark-mode');
    localStorageMock.setItem('game-hub-theme', 'dark');

    const manager = new ThemeManager();
    const btn = document.getElementById('theme-toggle-btn');

    btn.click();

    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'light');
  });
});

// ============================================
// updateSoundButtonIcon Tests
// ============================================
describe('updateSoundButtonIcon', () => {
  let updateSoundButtonIcon;

  beforeEach(() => {
    const gameModule = require('./game.js');
    updateSoundButtonIcon = gameModule.updateSoundButtonIcon;
  });

  test('should show on icon when enabled', () => {
    const btn = document.getElementById('sound-toggle-btn');
    updateSoundButtonIcon(btn, true);

    const onIcon = btn.querySelector('.sound-on-icon');
    const offIcon = btn.querySelector('.sound-off-icon');

    expect(onIcon.style.display).toBe('inline');
    expect(offIcon.style.display).toBe('none');
  });

  test('should show off icon when disabled', () => {
    const btn = document.getElementById('sound-toggle-btn');
    updateSoundButtonIcon(btn, false);

    const onIcon = btn.querySelector('.sound-on-icon');
    const offIcon = btn.querySelector('.sound-off-icon');

    expect(onIcon.style.display).toBe('none');
    expect(offIcon.style.display).toBe('inline');
  });
});
