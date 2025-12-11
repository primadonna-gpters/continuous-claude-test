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

// Mock canvas context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  roundRect: jest.fn(),
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
    <div class="game-container">
      <button id="theme-toggle-btn"></button>
      <button id="sound-toggle-btn">
        <span class="sound-on-icon"></span>
        <span class="sound-off-icon"></span>
      </button>
      <div id="score">0</div>
      <div id="best-score">0</div>
      <div class="canvas-wrapper" style="width: 400px;">
        <canvas id="game-canvas"></canvas>
      </div>
      <div id="game-message" class="hidden">
        <p></p>
        <button id="retry-btn">Try Again</button>
      </div>
      <div id="start-message"></div>
      <button id="new-game-btn">New Game</button>
      <button id="pause-btn">⏸️</button>
      <div class="mobile-controls">
        <button class="control-btn" data-direction="up">↑</button>
        <button class="control-btn" data-direction="left">←</button>
        <button class="control-btn" data-direction="down">↓</button>
        <button class="control-btn" data-direction="right">→</button>
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

  test('should load sound preference from localStorage (enabled by default)', () => {
    const soundManager = new SoundManager();
    expect(soundManager.enabled).toBe(true);
  });

  test('should load sound preference from localStorage (disabled)', () => {
    localStorageMock.setItem('snake-sound', 'false');
    const soundManager = new SoundManager();
    expect(soundManager.enabled).toBe(false);
  });

  test('should toggle sound and save preference', () => {
    const soundManager = new SoundManager();
    const result = soundManager.toggle();
    expect(result).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('snake-sound', 'false');
  });

  test('playEat should play two notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playEat();
    jest.advanceTimersByTime(100);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('playMove should call playTone', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playMove();

    expect(spy).toHaveBeenCalledWith(220, 0.03, 'square', 0.05);
  });

  test('playGameOver should play descending notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playGameOver();
    jest.advanceTimersByTime(700);

    expect(spy).toHaveBeenCalledTimes(4);
  });

  test('playStart should play ascending notes', () => {
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playStart();
    jest.advanceTimersByTime(300);

    expect(spy).toHaveBeenCalledTimes(3);
  });

  test('should not play when disabled', () => {
    localStorageMock.setItem('snake-sound', 'false');
    const soundManager = new SoundManager();
    const spy = jest.spyOn(soundManager, 'playTone');

    soundManager.playGameOver();
    jest.advanceTimersByTime(700);

    expect(spy).not.toHaveBeenCalled();
  });
});

// ============================================
// SnakeGame Tests
// ============================================
describe('SnakeGame', () => {
  let SnakeGame, SoundManager;

  beforeEach(() => {
    const gameModule = require('./game.js');
    SoundManager = gameModule.SoundManager;
    SnakeGame = gameModule.SnakeGame;
  });

  describe('Initialization', () => {
    test('should initialize with correct defaults', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      expect(game.tileCount).toBe(20);
      expect(game.score).toBe(0);
      expect(game.isRunning).toBe(false);
      expect(game.isPaused).toBe(false);
      expect(game.isStarted).toBe(false);
    });

    test('should load best score from localStorage', () => {
      localStorageMock.setItem('snake-best-score', '500');
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      expect(game.bestScore).toBe(500);
    });

    test('should initialize snake array empty before starting', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      expect(game.snake).toEqual([]);
    });
  });

  describe('Direction Setting', () => {
    test('setDirection should set nextDirection for valid direction', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.direction = { x: 0, y: 0 };

      game.setDirection('up');
      expect(game.nextDirection).toEqual({ x: 0, y: -1 });

      game.setDirection('down');
      expect(game.nextDirection).toEqual({ x: 0, y: 1 });

      game.setDirection('left');
      expect(game.nextDirection).toEqual({ x: -1, y: 0 });

      game.setDirection('right');
      expect(game.nextDirection).toEqual({ x: 1, y: 0 });
    });

    test('setDirection should prevent reverse direction', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      // Moving right, can't go left
      game.direction = { x: 1, y: 0 };
      game.nextDirection = { x: 1, y: 0 };
      game.setDirection('left');
      expect(game.nextDirection).toEqual({ x: 1, y: 0 });

      // Moving up, can't go down
      game.direction = { x: 0, y: -1 };
      game.nextDirection = { x: 0, y: -1 };
      game.setDirection('down');
      expect(game.nextDirection).toEqual({ x: 0, y: -1 });
    });

    test('setDirection should allow perpendicular direction', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      // Moving right, can go up
      game.direction = { x: 1, y: 0 };
      game.setDirection('up');
      expect(game.nextDirection).toEqual({ x: 0, y: -1 });
    });

    test('setDirection should ignore invalid direction', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.nextDirection = { x: 1, y: 0 };

      game.setDirection('invalid');
      expect(game.nextDirection).toEqual({ x: 1, y: 0 });
    });
  });

  describe('Game Start', () => {
    test('startNewGame should initialize snake in center', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.startNewGame();

      expect(game.snake.length).toBe(3);
      expect(game.snake[0].x).toBe(10); // center of 20x20 grid
      expect(game.snake[0].y).toBe(10);
      expect(game.isRunning).toBe(true);
      expect(game.isStarted).toBe(true);
    });

    test('startNewGame should reset score', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.score = 100;
      game.startNewGame();

      expect(game.score).toBe(0);
    });

    test('startNewGame should set initial direction to right', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.startNewGame();

      expect(game.direction).toEqual({ x: 1, y: 0 });
    });

    test('startNewGame should spawn food', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.startNewGame();

      expect(game.food.x).toBeDefined();
      expect(game.food.y).toBeDefined();
      expect(game.food.x).toBeGreaterThanOrEqual(0);
      expect(game.food.x).toBeLessThan(20);
    });

    test('startNewGame should play start sound', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playStart');
      const game = new SnakeGame(soundManager);

      game.startNewGame();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Food Spawning', () => {
    test('spawnFood should place food on grid', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.snake = [{ x: 5, y: 5 }];

      game.spawnFood();

      expect(game.food.x).toBeGreaterThanOrEqual(0);
      expect(game.food.x).toBeLessThan(game.tileCount);
      expect(game.food.y).toBeGreaterThanOrEqual(0);
      expect(game.food.y).toBeLessThan(game.tileCount);
    });

    test('spawnFood should not spawn on snake', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      // Fill most of the grid with snake
      game.snake = [];
      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 20; y++) {
          game.snake.push({ x, y });
        }
      }

      game.spawnFood();

      // Food should be in the last column
      expect(game.food.x).toBe(19);
    });
  });

  describe('Game Update', () => {
    test('update should move snake forward', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      const initialHeadX = game.snake[0].x;
      game.update();

      // Moving right, head should move +1 in x
      expect(game.snake[0].x).toBe(initialHeadX + 1);
    });

    test('update should not move when paused', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();
      game.isPaused = true;

      const initialHeadX = game.snake[0].x;
      game.update();

      expect(game.snake[0].x).toBe(initialHeadX);
    });

    test('update should grow snake when eating food', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      // Place food directly in front of snake
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      const initialLength = game.snake.length;

      game.update();

      expect(game.snake.length).toBe(initialLength + 1);
      expect(game.score).toBe(10);
    });

    test('update should play eat sound when eating food', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playEat');
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      game.update();

      expect(spy).toHaveBeenCalled();
    });

    test('update should increase speed every 50 points', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.score = 40;
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      const initialSpeed = game.gameSpeed;

      game.update();

      expect(game.gameSpeed).toBe(initialSpeed - 5);
    });
  });

  describe('Collision Detection', () => {
    test('update should end game on wall collision (left)', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.snake = [{ x: 0, y: 10 }];
      game.direction = { x: -1, y: 0 };
      game.nextDirection = { x: -1, y: 0 };

      game.update();

      expect(game.isRunning).toBe(false);
    });

    test('update should end game on wall collision (right)', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.snake = [{ x: 19, y: 10 }];
      game.direction = { x: 1, y: 0 };
      game.nextDirection = { x: 1, y: 0 };

      game.update();

      expect(game.isRunning).toBe(false);
    });

    test('update should end game on wall collision (top)', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.snake = [{ x: 10, y: 0 }];
      game.direction = { x: 0, y: -1 };
      game.nextDirection = { x: 0, y: -1 };

      game.update();

      expect(game.isRunning).toBe(false);
    });

    test('update should end game on wall collision (bottom)', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.snake = [{ x: 10, y: 19 }];
      game.direction = { x: 0, y: 1 };
      game.nextDirection = { x: 0, y: 1 };

      game.update();

      expect(game.isRunning).toBe(false);
    });

    test('update should end game on self collision', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      // Set up snake so head will collide with body
      game.snake = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
        { x: 6, y: 5 }
      ];
      game.direction = { x: 1, y: 0 };
      game.nextDirection = { x: 1, y: 0 };

      game.update();

      expect(game.isRunning).toBe(false);
    });
  });

  describe('Game Over', () => {
    test('gameOver should stop the game', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.gameOver();

      expect(game.isRunning).toBe(false);
    });

    test('gameOver should play game over sound', () => {
      const soundManager = new SoundManager();
      const spy = jest.spyOn(soundManager, 'playGameOver');
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.gameOver();

      expect(spy).toHaveBeenCalled();
    });

    test('gameOver should save best score if new high', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.score = 100;
      game.bestScore = 50;
      game.gameOver();

      expect(game.bestScore).toBe(100);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('snake-best-score', '100');
    });

    test('gameOver should show message', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.gameOver();

      const gameMessage = document.getElementById('game-message');
      expect(gameMessage.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Pause Functionality', () => {
    test('togglePause should pause running game', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.togglePause();

      expect(game.isPaused).toBe(true);
    });

    test('togglePause should resume paused game', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.togglePause(); // pause
      game.togglePause(); // resume

      expect(game.isPaused).toBe(false);
    });

    test('togglePause should not work when not started', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.togglePause();

      expect(game.isPaused).toBe(false);
    });

    test('updatePauseButton should show correct icon', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      game.isPaused = true;
      game.updatePauseButton();
      expect(game.pauseButton.textContent).toBe('▶️');

      game.isPaused = false;
      game.updatePauseButton();
      expect(game.pauseButton.textContent).toBe('⏸️');
    });
  });

  describe('Keyboard Input', () => {
    test('handleKeyDown should set direction for arrow keys', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();
      game.direction = { x: 0, y: 0 };

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      game.handleKeyDown(event);

      expect(game.nextDirection).toEqual({ x: 0, y: -1 });
    });

    test('handleKeyDown should toggle pause on space', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.startNewGame();

      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      game.handleKeyDown(event);

      expect(game.isPaused).toBe(true);
    });

    test('handleKeyDown should not process when not running', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.isRunning = false;

      const spy = jest.spyOn(game, 'setDirection');
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      game.handleKeyDown(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Touch/Swipe Input', () => {
    test('handleSwipe should detect right swipe', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.direction = { x: 0, y: 0 };

      game.handleSwipe(0, 0, 100, 0);

      expect(game.nextDirection).toEqual({ x: 1, y: 0 });
    });

    test('handleSwipe should detect left swipe', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.direction = { x: 0, y: 0 };

      game.handleSwipe(100, 0, 0, 0);

      expect(game.nextDirection).toEqual({ x: -1, y: 0 });
    });

    test('handleSwipe should detect down swipe', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.direction = { x: 0, y: 0 };

      game.handleSwipe(0, 0, 0, 100);

      expect(game.nextDirection).toEqual({ x: 0, y: 1 });
    });

    test('handleSwipe should detect up swipe', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.direction = { x: 0, y: 0 };

      game.handleSwipe(0, 100, 0, 0);

      expect(game.nextDirection).toEqual({ x: 0, y: -1 });
    });

    test('handleSwipe should ignore small swipes', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
      game.nextDirection = { x: 1, y: 0 };

      game.handleSwipe(0, 0, 10, 10);

      expect(game.nextDirection).toEqual({ x: 1, y: 0 });
    });
  });

  describe('Score Management', () => {
    test('updateScoreDisplay should update DOM', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.score = 123;
      game.updateScoreDisplay();

      expect(document.getElementById('score').textContent).toBe('123');
    });

    test('updateBestScoreDisplay should update DOM', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.bestScore = 456;
      game.updateBestScoreDisplay();

      expect(document.getElementById('best-score').textContent).toBe('456');
    });

    test('saveBestScore should save to localStorage', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.bestScore = 789;
      game.saveBestScore();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('snake-best-score', '789');
    });
  });

  describe('Message Display', () => {
    test('showMessage should display message', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.showMessage('Test Message');

      const gameMessage = document.getElementById('game-message');
      expect(gameMessage.classList.contains('hidden')).toBe(false);
      expect(gameMessage.querySelector('p').textContent).toBe('Test Message');
    });

    test('hideMessage should hide message', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);

      game.showMessage('Test');
      game.hideMessage();

      const gameMessage = document.getElementById('game-message');
      expect(gameMessage.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Canvas Drawing', () => {
    test('draw should call canvas context methods', () => {
      const soundManager = new SoundManager();
      const game = new SnakeGame(soundManager);
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
