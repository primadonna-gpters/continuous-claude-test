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
  frequency: { setValueAtTime: jest.fn() },
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

// Mock canvas context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  clearRect: jest.fn()
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  jest.useFakeTimers();

  window.matchMedia = mockMatchMedia(false);
  mockAudioContext.state = 'running';
  window.AudioContext.mockClear();

  document.body.innerHTML = `
    <div class="game-container" id="game-container" style="width: 300px; height: 600px;">
      <button id="theme-toggle-btn"></button>
      <button id="sound-toggle-btn">
        <span class="sound-on-icon"></span>
        <span class="sound-off-icon"></span>
      </button>
      <div id="score">0</div>
      <div id="best-score">0</div>
      <div id="level">1</div>
      <div id="lines">0</div>
      <canvas id="game-canvas"></canvas>
      <canvas id="next-canvas"></canvas>
      <canvas id="hold-canvas"></canvas>
      <div id="game-message" class="hidden">
        <p></p>
        <button id="retry-btn">Try Again</button>
      </div>
      <div id="start-message"></div>
      <button id="new-game-btn">New Game</button>
      <button id="pause-btn">⏸️</button>
      <div class="mobile-controls">
        <button class="control-btn" data-action="left">←</button>
        <button class="control-btn" data-action="right">→</button>
        <button class="control-btn" data-action="rotateRight">↻</button>
        <button class="control-btn" data-action="softDrop">↓</button>
        <button class="control-btn" data-action="hardDrop">⬇</button>
        <button class="control-btn" data-action="hold">H</button>
      </div>
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

  test('should load sound preference from localStorage', () => {
    const soundManager = new SoundManager();
    expect(soundManager.enabled).toBe(true);
  });

  test('should toggle sound', () => {
    const soundManager = new SoundManager();
    const result = soundManager.toggle();
    expect(result).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('tetris-sound', 'false');
  });

  test('playMove should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playMove();
    expect(spy).toHaveBeenCalledWith(200, 0.05, 'square', 0.1);
  });

  test('playRotate should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playRotate();
    expect(spy).toHaveBeenCalledWith(400, 0.08, 'sine', 0.15);
  });

  test('playDrop should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playDrop();
    expect(spy).toHaveBeenCalledWith(150, 0.15, 'triangle', 0.2);
  });

  test('playLineClear should play multiple notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playLineClear(3);
    jest.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  test('playTetris should play chord', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playTetris();
    jest.advanceTimersByTime(500);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  test('playHold should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playHold();
    expect(spy).toHaveBeenCalledWith(300, 0.1, 'triangle', 0.15);
  });

  test('playGameOver should play descending notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playGameOver();
    jest.advanceTimersByTime(1100);
    expect(spy).toHaveBeenCalledTimes(5);
  });

  test('playStart should play ascending notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playStart();
    jest.advanceTimersByTime(400);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  test('playLevelUp should play notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');
    soundManager.playLevelUp();
    jest.advanceTimersByTime(500);
    expect(spy).toHaveBeenCalledTimes(4);
  });
});

// ============================================
// TETROMINOES Tests
// ============================================
describe('TETROMINOES', () => {
  let TETROMINOES, TETROMINO_NAMES;

  beforeEach(() => {
    const gameModule = require('./game.js');
    TETROMINOES = gameModule.TETROMINOES;
    TETROMINO_NAMES = gameModule.TETROMINO_NAMES;
  });

  test('should have 7 tetrominoes defined', () => {
    expect(TETROMINO_NAMES.length).toBe(7);
    expect(TETROMINO_NAMES).toContain('I');
    expect(TETROMINO_NAMES).toContain('O');
    expect(TETROMINO_NAMES).toContain('T');
    expect(TETROMINO_NAMES).toContain('S');
    expect(TETROMINO_NAMES).toContain('Z');
    expect(TETROMINO_NAMES).toContain('J');
    expect(TETROMINO_NAMES).toContain('L');
  });

  test('each tetromino should have shape and color', () => {
    TETROMINO_NAMES.forEach(name => {
      expect(TETROMINOES[name].shape).toBeDefined();
      expect(TETROMINOES[name].color).toBeDefined();
      expect(Array.isArray(TETROMINOES[name].shape)).toBe(true);
    });
  });

  test('I piece should be 4x4', () => {
    expect(TETROMINOES.I.shape.length).toBe(4);
    expect(TETROMINOES.I.shape[0].length).toBe(4);
  });

  test('O piece should be 2x2', () => {
    expect(TETROMINOES.O.shape.length).toBe(2);
    expect(TETROMINOES.O.shape[0].length).toBe(2);
  });
});

// ============================================
// TetrisGame Tests
// ============================================
describe('TetrisGame', () => {
  let TetrisGame, SoundManager, TETROMINOES;

  beforeEach(() => {
    const gameModule = require('./game.js');
    TetrisGame = gameModule.TetrisGame;
    SoundManager = gameModule.SoundManager;
    TETROMINOES = gameModule.TETROMINOES;
  });

  describe('Initialization', () => {
    test('should initialize with correct defaults', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      expect(game.cols).toBe(10);
      expect(game.rows).toBe(20);
      expect(game.score).toBe(0);
      expect(game.level).toBe(1);
      expect(game.lines).toBe(0);
      expect(game.isRunning).toBe(false);
    });

    test('should load best score from localStorage', () => {
      localStorageMock.setItem('tetris-best-score', '10000');
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      expect(game.bestScore).toBe(10000);
    });

    test('should initialize empty board', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      expect(game.board).toEqual([]);
    });
  });

  describe('Game Start', () => {
    test('startNewGame should initialize board', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      game.startNewGame();

      expect(game.board.length).toBe(20);
      expect(game.board[0].length).toBe(10);
      expect(game.isRunning).toBe(true);
      expect(game.isStarted).toBe(true);
    });

    test('startNewGame should reset score and level', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      game.score = 100;
      game.level = 5;
      game.lines = 40;

      game.startNewGame();

      expect(game.score).toBe(0);
      expect(game.level).toBe(1);
      expect(game.lines).toBe(0);
    });

    test('startNewGame should spawn pieces', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      game.startNewGame();

      expect(game.currentPiece).not.toBeNull();
      expect(game.nextPiece).not.toBeNull();
    });

    test('startNewGame should play start sound', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playStart');
      const game = new TetrisGame(soundManager);

      game.startNewGame();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Piece Generation', () => {
    test('getRandomPiece should return valid tetromino name', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      const piece = game.getRandomPiece();

      expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece);
    });

    test('getRandomPiece should use 7-bag randomizer', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      // Get all 7 pieces
      const pieces = [];
      for (let i = 0; i < 7; i++) {
        pieces.push(game.getRandomPiece());
      }

      // Should contain all 7 unique pieces
      const uniquePieces = new Set(pieces);
      expect(uniquePieces.size).toBe(7);
    });

    test('spawnPiece should place piece at top center', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Current piece should be at top center
      expect(game.currentPiece.y).toBe(0);
      expect(game.currentPiece.x).toBeGreaterThanOrEqual(3);
      expect(game.currentPiece.x).toBeLessThanOrEqual(4);
    });
  });

  describe('Collision Detection', () => {
    test('checkCollision should detect left wall', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.currentPiece.x = 0;
      expect(game.checkCollision(-1, 0)).toBe(true);
    });

    test('checkCollision should detect right wall', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.currentPiece.x = game.cols - game.currentPiece.shape[0].length;
      expect(game.checkCollision(1, 0)).toBe(true);
    });

    test('checkCollision should detect floor', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Use O piece (2x2, all cells filled) for predictable floor collision
      game.currentPiece = {
        name: 'O',
        shape: TETROMINOES.O.shape.map(row => [...row]),
        color: TETROMINOES.O.color,
        x: 4,
        y: game.rows - 2 // O piece is 2x2, place it at bottom
      };
      expect(game.checkCollision(0, 1)).toBe(true);
    });

    test('checkCollision should detect placed blocks', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Place a block on the board
      game.board[19][5] = '#ff0000';
      game.currentPiece.y = 17;
      game.currentPiece.x = 4;

      expect(game.checkCollision(0, 2)).toBe(true);
    });
  });

  describe('Movement', () => {
    test('movePiece should move left', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const initialX = game.currentPiece.x;
      game.movePiece(-1, 0);

      expect(game.currentPiece.x).toBe(initialX - 1);
    });

    test('movePiece should move right', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const initialX = game.currentPiece.x;
      game.movePiece(1, 0);

      expect(game.currentPiece.x).toBe(initialX + 1);
    });

    test('movePiece should move down', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const initialY = game.currentPiece.y;
      game.movePiece(0, 1);

      expect(game.currentPiece.y).toBe(initialY + 1);
    });

    test('movePiece should return false on collision', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.currentPiece.x = 0;
      const result = game.movePiece(-1, 0);

      expect(result).toBe(false);
    });

    test('movePiece should play sound on horizontal move', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playMove');
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.movePiece(1, 0);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Rotation', () => {
    test('rotatePiece should rotate clockwise', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Use T piece for predictable rotation
      game.currentPiece = {
        name: 'T',
        shape: TETROMINOES.T.shape.map(row => [...row]),
        color: TETROMINOES.T.color,
        x: 4,
        y: 0
      };

      const originalShape = game.currentPiece.shape.map(row => [...row]);
      game.rotatePiece(1);

      // Shape should be different after rotation (unless blocked)
      expect(game.currentPiece.shape).not.toEqual(originalShape);
    });

    test('rotatePiece should wall kick', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Place piece at edge
      game.currentPiece.x = 0;
      const initialX = game.currentPiece.x;

      game.rotatePiece(1);

      // X position may have changed due to wall kick
      expect(game.currentPiece.x).toBeGreaterThanOrEqual(0);
    });

    test('rotatePiece should play sound on success', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playRotate');
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.currentPiece.x = 4;
      game.currentPiece.y = 5;
      game.rotatePiece(1);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Hard Drop', () => {
    test('hardDrop should move piece to bottom', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.hardDrop();

      // Piece should have been locked (new piece spawned)
      expect(game.currentPiece.y).toBe(0);
    });

    test('hardDrop should add score based on distance', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const initialScore = game.score;
      game.hardDrop();

      expect(game.score).toBeGreaterThan(initialScore);
    });

    test('hardDrop should play sound', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playDrop');
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.hardDrop();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Hold Piece', () => {
    test('holdCurrentPiece should store current piece', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const currentName = game.currentPiece.name;
      game.holdCurrentPiece();

      expect(game.holdPiece.name).toBe(currentName);
    });

    test('holdCurrentPiece should not allow double hold', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Set specific pieces to make test deterministic
      game.currentPiece = {
        name: 'T',
        shape: TETROMINOES.T.shape.map(row => [...row]),
        color: TETROMINOES.T.color,
        x: 3,
        y: 0
      };
      game.holdPiece = {
        name: 'O',
        shape: TETROMINOES.O.shape.map(row => [...row]),
        color: TETROMINOES.O.color
      };
      game.canHold = true;

      game.holdCurrentPiece(); // Swaps T with O, sets canHold to false
      expect(game.canHold).toBe(false);
      expect(game.holdPiece.name).toBe('T');
      expect(game.currentPiece.name).toBe('O');

      const holdAfterFirst = game.holdPiece.name;
      const currentAfterFirst = game.currentPiece.name;

      game.holdCurrentPiece(); // Should do nothing because canHold is false

      // Hold piece should remain unchanged
      expect(game.holdPiece.name).toBe(holdAfterFirst);
      // Current piece should also remain unchanged
      expect(game.currentPiece.name).toBe(currentAfterFirst);
      // canHold should still be false
      expect(game.canHold).toBe(false);
    });

    test('holdCurrentPiece should swap with existing hold', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.holdCurrentPiece();
      const firstHold = game.holdPiece.name;

      // Force new piece and reset canHold
      game.canHold = true;
      const newCurrent = game.currentPiece.name;

      game.holdCurrentPiece();

      expect(game.currentPiece.name).toBe(firstHold);
      expect(game.holdPiece.name).toBe(newCurrent);
    });

    test('holdCurrentPiece should play sound', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playHold');
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.holdCurrentPiece();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Line Clearing', () => {
    test('clearLines should remove complete lines', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Fill bottom row
      game.board[19] = Array(10).fill('#ff0000');

      game.clearLines();

      // Bottom row should be empty now
      expect(game.board[19].every(cell => cell === 0)).toBe(true);
    });

    test('clearLines should add score based on lines cleared', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Fill bottom row
      game.board[19] = Array(10).fill('#ff0000');
      game.score = 0;

      game.clearLines();

      expect(game.score).toBe(100); // 100 points for 1 line at level 1
    });

    test('clearLines should update lines count', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Fill bottom 2 rows
      game.board[18] = Array(10).fill('#ff0000');
      game.board[19] = Array(10).fill('#ff0000');

      game.clearLines();

      expect(game.lines).toBe(2);
    });

    test('clearLines should play tetris sound for 4 lines', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playTetris');
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      // Fill bottom 4 rows
      game.board[16] = Array(10).fill('#ff0000');
      game.board[17] = Array(10).fill('#ff0000');
      game.board[18] = Array(10).fill('#ff0000');
      game.board[19] = Array(10).fill('#ff0000');

      game.clearLines();

      expect(spy).toHaveBeenCalled();
    });

    test('clearLines should level up every 10 lines', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playLevelUp');
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.lines = 9;
      game.board[19] = Array(10).fill('#ff0000');

      game.clearLines();

      expect(game.level).toBe(2);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Game Over', () => {
    test('gameOver should stop the game', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.gameOver();

      expect(game.isRunning).toBe(false);
    });

    test('gameOver should save best score', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.score = 5000;
      game.bestScore = 1000;

      game.gameOver();

      expect(game.bestScore).toBe(5000);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tetris-best-score', '5000');
    });

    test('gameOver should play sound', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playGameOver');
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.gameOver();

      expect(spy).toHaveBeenCalled();
    });

    test('gameOver should show message', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.gameOver();

      const gameMessage = document.getElementById('game-message');
      expect(gameMessage.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Pause Functionality', () => {
    test('togglePause should pause running game', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.togglePause();

      expect(game.isPaused).toBe(true);
    });

    test('togglePause should resume paused game', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.togglePause();
      game.togglePause();

      expect(game.isPaused).toBe(false);
    });

    test('update should not run when paused', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.isPaused = true;
      const initialY = game.currentPiece.y;

      game.update();

      expect(game.currentPiece.y).toBe(initialY);
    });
  });

  describe('Keyboard Input', () => {
    test('handleKeyDown should move left on ArrowLeft', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const spy = jest.spyOn(game, 'movePiece');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      game.handleKeyDown(event);

      expect(spy).toHaveBeenCalledWith(-1, 0);
    });

    test('handleKeyDown should rotate on ArrowUp', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const spy = jest.spyOn(game, 'rotatePiece');
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      game.handleKeyDown(event);

      expect(spy).toHaveBeenCalledWith(1);
    });

    test('handleKeyDown should hard drop on space', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const spy = jest.spyOn(game, 'hardDrop');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      game.handleKeyDown(event);

      expect(spy).toHaveBeenCalled();
    });

    test('handleKeyDown should hold on c', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const spy = jest.spyOn(game, 'holdCurrentPiece');
      const event = new KeyboardEvent('keydown', { key: 'c' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      game.handleKeyDown(event);

      expect(spy).toHaveBeenCalled();
    });

    test('handleKeyDown should not process when paused', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.isPaused = true;
      const spy = jest.spyOn(game, 'movePiece');

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      game.handleKeyDown(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Action Handling', () => {
    test('handleAction softDrop should add score', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      const initialScore = game.score;
      game.handleAction('softDrop');

      expect(game.score).toBe(initialScore + 1);
    });

    test('handleAction should not work when not running', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();
      game.isRunning = false;

      const spy = jest.spyOn(game, 'movePiece');
      game.handleAction('left');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Display Updates', () => {
    test('updateScoreDisplay should update DOM', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      game.score = 999;
      game.updateScoreDisplay();

      expect(document.getElementById('score').textContent).toBe('999');
    });

    test('updateLevelDisplay should update DOM', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      game.level = 5;
      game.updateLevelDisplay();

      expect(document.getElementById('level').textContent).toBe('5');
    });

    test('updateLinesDisplay should update DOM', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);

      game.lines = 42;
      game.updateLinesDisplay();

      expect(document.getElementById('lines').textContent).toBe('42');
    });
  });

  describe('Canvas Drawing', () => {
    test('draw should call canvas context methods', () => {
      const soundManager = new SoundManager();
      const game = new TetrisGame(soundManager);
      game.startNewGame();

      game.draw();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
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

  test('should toggle theme on button click', () => {
    document.body.classList.remove('dark-mode');

    const manager = new ThemeManager();
    const btn = document.getElementById('theme-toggle-btn');

    btn.click();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
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

    expect(btn.querySelector('.sound-on-icon').style.display).toBe('inline');
    expect(btn.querySelector('.sound-off-icon').style.display).toBe('none');
  });

  test('should show off icon when disabled', () => {
    const btn = document.getElementById('sound-toggle-btn');
    updateSoundButtonIcon(btn, false);

    expect(btn.querySelector('.sound-on-icon').style.display).toBe('none');
    expect(btn.querySelector('.sound-off-icon').style.display).toBe('inline');
  });
});
