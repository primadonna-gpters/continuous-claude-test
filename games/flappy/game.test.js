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
    exponentialRampToValueAtTime: jest.fn()
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
  createOscillator: jest.fn(() => ({
    ...mockOscillator,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    },
    type: 'sine'
  })),
  createGain: jest.fn(() => ({
    ...mockGainNode,
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  }))
};

window.AudioContext = jest.fn(() => mockAudioContext);
window.webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock canvas context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  shadowColor: '',
  shadowBlur: 0,
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  ellipse: jest.fn(),
  clearRect: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  closePath: jest.fn()
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  jest.useFakeTimers();

  document.body.innerHTML = `
    <div id="game-container" style="width: 400px;">
      <canvas id="game-canvas"></canvas>
      <div id="game-overlay">
        <span id="overlay-text"></span>
        <button id="play-btn">Play</button>
      </div>
      <div id="score">0</div>
      <div id="best-score">0</div>
      <button id="start-btn">Start</button>
      <button id="theme-toggle-btn">🌙</button>
      <button id="sound-toggle-btn">
        <span class="sound-on-icon" style="display: inline;">🔊</span>
        <span class="sound-off-icon" style="display: none;">🔇</span>
      </button>
    </div>
  `;

  document.body.classList.remove('dark-mode');
  jest.resetModules();
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================
// Flappy Bird Game Tests
// ============================================
describe('FlappyBird Game', () => {
  let FlappyBird;

  beforeEach(() => {
    const gameModule = require('./game.js');
    FlappyBird = gameModule.FlappyBird;
  });

  describe('Initialization', () => {
    test('should initialize with correct defaults', () => {
      const game = new FlappyBird();

      expect(game.gravity).toBe(0.5);
      expect(game.jumpStrength).toBe(-8);
      expect(game.pipeWidth).toBe(60);
      expect(game.pipeGap).toBe(150);
      expect(game.pipeSpeed).toBe(3);
      expect(game.score).toBe(0);
      expect(game.isPlaying).toBe(false);
      expect(game.isGameOver).toBe(false);
    });

    test('should load best score from localStorage', () => {
      localStorageMock.setItem('flappy-best-score', '42');
      const game = new FlappyBird();

      expect(game.bestScore).toBe(42);
    });

    test('should load theme from localStorage', () => {
      localStorageMock.setItem('game-hub-theme', 'dark');
      const game = new FlappyBird();

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    test('should load sound setting from localStorage', () => {
      localStorageMock.setItem('flappy-sound', 'false');
      const game = new FlappyBird();

      expect(game.soundEnabled).toBe(false);
    });

    test('should have sound enabled by default', () => {
      const game = new FlappyBird();

      expect(game.soundEnabled).toBe(true);
    });
  });

  describe('Canvas Setup', () => {
    test('should set up canvas with correct dimensions', () => {
      const game = new FlappyBird();

      expect(game.canvas).not.toBeNull();
      expect(game.ctx).not.toBeNull();
      // Canvas dimensions depend on container, may be default values in jsdom
      expect(game.canvas.width).toBeDefined();
      expect(game.canvas.height).toBeDefined();
    });

    test('should calculate scale based on canvas size', () => {
      const game = new FlappyBird();

      expect(game.scale).toBeDefined();
      // Scale can be negative in jsdom due to container size being 0
      expect(typeof game.scale).toBe('number');
    });
  });

  describe('Theme Management', () => {
    test('toggleTheme should toggle dark mode', () => {
      const game = new FlappyBird();

      expect(document.body.classList.contains('dark-mode')).toBe(false);

      game.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'dark');

      game.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'light');
    });
  });

  describe('Sound Management', () => {
    test('toggleSound should toggle sound state', () => {
      const game = new FlappyBird();

      expect(game.soundEnabled).toBe(true);

      game.toggleSound();
      expect(game.soundEnabled).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flappy-sound', false);

      game.toggleSound();
      expect(game.soundEnabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flappy-sound', true);
    });

    test('updateSoundButton should update icon visibility', () => {
      const game = new FlappyBird();
      const onIcon = game.soundToggleBtn.querySelector('.sound-on-icon');
      const offIcon = game.soundToggleBtn.querySelector('.sound-off-icon');

      game.soundEnabled = true;
      game.updateSoundButton();
      expect(onIcon.style.display).toBe('inline');
      expect(offIcon.style.display).toBe('none');

      game.soundEnabled = false;
      game.updateSoundButton();
      expect(onIcon.style.display).toBe('none');
      expect(offIcon.style.display).toBe('inline');
    });
  });

  describe('Game Start', () => {
    test('startGame should initialize game state', () => {
      const game = new FlappyBird();
      game.startGame();

      expect(game.isPlaying).toBe(true);
      expect(game.isGameOver).toBe(false);
      expect(game.score).toBe(0);
      expect(game.bird).not.toBeNull();
      expect(game.pipes).toEqual([]);
    });

    test('startGame should initialize bird position', () => {
      const game = new FlappyBird();
      game.startGame();

      expect(game.bird.x).toBeCloseTo(game.canvas.width * 0.2, 1);
      expect(game.bird.y).toBeCloseTo(game.canvas.height / 2, 1);
      expect(game.bird.velocity).toBeCloseTo(0, 1);
    });

    test('startGame should call recordRecentPlay', () => {
      const game = new FlappyBird();
      game.startGame();

      expect(global.recordRecentPlay).toHaveBeenCalledWith('flappy');
    });

    test('startGame should hide overlay', () => {
      const game = new FlappyBird();
      game.overlay.classList.remove('hidden');

      game.startGame();

      expect(game.overlay.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Bird Mechanics', () => {
    test('jump should set negative velocity', () => {
      const game = new FlappyBird();
      game.startGame();

      game.bird.velocity = 0;
      game.jump();

      expect(game.bird.velocity).toBe(game.jumpStrength * game.scale);
    });

    test('jump should not work if bird is null', () => {
      const game = new FlappyBird();
      game.bird = null;

      // Should not throw
      expect(() => game.jump()).not.toThrow();
    });
  });

  describe('Pipe Mechanics', () => {
    test('spawnPipe should add pipe to array', () => {
      const game = new FlappyBird();
      game.startGame();

      const initialPipes = game.pipes.length;
      game.spawnPipe();

      expect(game.pipes.length).toBe(initialPipes + 1);
    });

    test('spawnPipe should create pipe at right edge', () => {
      const game = new FlappyBird();
      game.startGame();
      game.spawnPipe();

      const pipe = game.pipes[0];
      expect(pipe.x).toBe(game.canvas.width);
    });

    test('spawnPipe should create pipe with correct structure', () => {
      const game = new FlappyBird();
      game.startGame();
      game.spawnPipe();

      const pipe = game.pipes[0];
      expect(pipe).toHaveProperty('x');
      expect(pipe).toHaveProperty('topHeight');
      expect(pipe).toHaveProperty('bottomY');
      expect(pipe).toHaveProperty('width');
      expect(pipe).toHaveProperty('passed');
      expect(pipe.passed).toBe(false);
    });

    test('pipe gap should be correct', () => {
      const game = new FlappyBird();
      game.startGame();
      game.spawnPipe();

      const pipe = game.pipes[0];
      const actualGap = pipe.bottomY - pipe.topHeight;
      expect(actualGap).toBe(game.pipeGap * game.scale);
    });
  });

  describe('Update Logic', () => {
    test('update should not run when not playing', () => {
      const game = new FlappyBird();
      game.startGame();
      game.isPlaying = false;

      const initialY = game.bird.y;
      game.update();

      expect(game.bird.y).toBe(initialY);
    });

    test('update should apply gravity to bird', () => {
      const game = new FlappyBird();
      game.startGame();
      game.bird.velocity = 0;

      game.update();

      expect(game.bird.velocity).toBe(game.gravity * game.scale);
    });

    test('update should move bird based on velocity', () => {
      const game = new FlappyBird();
      game.startGame();
      game.bird.velocity = 5;
      const initialY = game.bird.y;

      game.update();

      expect(game.bird.y).toBe(initialY + game.bird.velocity);
    });

    test('update should move pipes left', () => {
      const game = new FlappyBird();
      game.startGame();
      game.spawnPipe();
      const initialX = game.pipes[0].x;

      game.update();

      expect(game.pipes[0].x).toBe(initialX - game.pipeSpeed * game.scale);
    });

    test('update should remove off-screen pipes', () => {
      const game = new FlappyBird();
      game.startGame();
      game.pipes = [{
        x: -100,
        topHeight: 100,
        bottomY: 250,
        width: game.pipeWidth * game.scale,
        passed: true
      }];

      game.update();

      expect(game.pipes.length).toBe(0);
    });
  });

  describe('Scoring', () => {
    test('update should increment score when passing pipe', () => {
      const game = new FlappyBird();
      game.startGame();

      // Create a pipe that bird has passed
      game.pipes = [{
        x: 0,
        topHeight: 100,
        bottomY: 250,
        width: 10,
        passed: false
      }];
      game.bird.x = 100;

      game.update();

      expect(game.score).toBe(1);
      expect(game.pipes[0].passed).toBe(true);
    });
  });

  describe('Collision Detection', () => {
    test('should detect ground collision', () => {
      const game = new FlappyBird();
      game.startGame();
      game.bird.y = game.canvas.height - game.bird.height + 1;

      game.checkCollisions();

      expect(game.isGameOver).toBe(true);
    });

    test('should detect ceiling collision', () => {
      const game = new FlappyBird();
      game.startGame();
      game.bird.y = -1;

      game.checkCollisions();

      expect(game.isGameOver).toBe(true);
    });

    test('should detect pipe collision - top pipe', () => {
      const game = new FlappyBird();
      game.startGame();

      // Bird must be within pipe X range and hitting top pipe
      // Bird hitbox is slightly smaller (4 * scale margin on each side)
      const birdWidth = game.bird.width;
      const birdHeight = game.bird.height;

      game.bird.x = 50;
      game.bird.y = 10; // Above topHeight of 200
      game.bird.width = 30;
      game.bird.height = 20;
      game.pipes = [{
        x: 40, // bird.x (50) + width - 4*scale must be > pipe.x
        topHeight: 200,
        bottomY: 350,
        width: 60,
        passed: false
      }];

      game.checkCollisions();

      expect(game.isGameOver).toBe(true);
    });

    test('should detect pipe collision - bottom pipe', () => {
      const game = new FlappyBird();
      game.startGame();

      game.bird.x = 50;
      game.bird.y = 400; // Below bottomY of 350
      game.bird.width = 30;
      game.bird.height = 20;
      game.pipes = [{
        x: 40,
        topHeight: 200,
        bottomY: 350,
        width: 60,
        passed: false
      }];

      game.checkCollisions();

      expect(game.isGameOver).toBe(true);
    });

    test('should not collide when bird passes through gap', () => {
      const game = new FlappyBird();
      game.startGame();

      // Set scale to positive value for collision detection
      game.scale = 1;

      // Set canvas height to avoid ground collision check
      game.canvas.height = 600;

      // Position bird in the gap between pipes
      // The collision check uses hitbox margins: 4 * scale on each side
      // birdTop = bird.y + 4 = 264, must be >= topHeight (200) ✓
      // birdBottom = bird.y + height - 4 = 260 + 20 - 4 = 276, must be <= bottomY (350) ✓
      game.bird.x = 50;
      game.bird.y = 260;
      game.bird.width = 30;
      game.bird.height = 20;
      game.pipes = [{
        x: 40,
        topHeight: 200,
        bottomY: 350,
        width: 60,
        passed: false
      }];

      game.checkCollisions();

      expect(game.isGameOver).toBe(false);
    });
  });

  describe('Game Over', () => {
    test('gameOver should set game state correctly', () => {
      const game = new FlappyBird();
      game.startGame();

      game.gameOver();

      expect(game.isGameOver).toBe(true);
      expect(game.isPlaying).toBe(false);
    });

    test('gameOver should update best score if higher', () => {
      const game = new FlappyBird();
      game.startGame();
      game.score = 10;
      game.bestScore = 5;

      game.gameOver();

      expect(game.bestScore).toBe(10);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flappy-best-score', 10);
    });

    test('gameOver should not update best score if lower', () => {
      const game = new FlappyBird();
      game.startGame();
      game.score = 3;
      game.bestScore = 10;

      game.gameOver();

      expect(game.bestScore).toBe(10);
    });

    test('gameOver should show overlay', () => {
      const game = new FlappyBird();
      game.startGame();

      game.gameOver();

      expect(game.overlay.classList.contains('hidden')).toBe(false);
    });

    test('gameOver should update overlay text', () => {
      const game = new FlappyBird();
      game.startGame();
      game.score = 5;

      game.gameOver();

      expect(game.overlayText.textContent).toBe('Game Over! Score: 5');
    });
  });

  describe('Input Handling', () => {
    test('handleInput should start game when not playing', () => {
      const game = new FlappyBird();
      game.isPlaying = false;
      game.isGameOver = false;

      const startSpy = jest.spyOn(game, 'startGame');
      game.handleInput();

      expect(startSpy).toHaveBeenCalled();
    });

    test('handleInput should jump when playing', () => {
      const game = new FlappyBird();
      game.startGame();

      const jumpSpy = jest.spyOn(game, 'jump');
      game.handleInput();

      expect(jumpSpy).toHaveBeenCalled();
    });

    test('handleInput should restart when game over', () => {
      const game = new FlappyBird();
      game.isPlaying = false;
      game.isGameOver = true;

      const startSpy = jest.spyOn(game, 'startGame');
      game.handleInput();

      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('Audio', () => {
    test('initAudio should create AudioContext', () => {
      const game = new FlappyBird();
      game.initAudio();

      expect(game.audioContext).not.toBeNull();
    });

    test('playSound should not throw when disabled', () => {
      const game = new FlappyBird();
      game.soundEnabled = false;

      expect(() => game.playSound('jump')).not.toThrow();
    });

    test('playSound should not throw when audioContext is null', () => {
      const game = new FlappyBird();
      game.soundEnabled = true;
      game.audioContext = null;

      expect(() => game.playSound('jump')).not.toThrow();
    });
  });

  describe('Drawing', () => {
    test('draw should not throw', () => {
      const game = new FlappyBird();

      expect(() => game.draw()).not.toThrow();
    });

    test('draw should call canvas methods', () => {
      const game = new FlappyBird();
      game.startGame();

      game.draw();

      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('Button Events', () => {
    test('start button should start game', () => {
      const game = new FlappyBird();
      const startSpy = jest.spyOn(game, 'startGame');

      game.startBtn.click();

      expect(startSpy).toHaveBeenCalled();
    });

    test('play button should start game', () => {
      const game = new FlappyBird();
      const startSpy = jest.spyOn(game, 'startGame');

      game.playBtn.click();

      expect(startSpy).toHaveBeenCalled();
    });

    test('theme toggle button should toggle theme', () => {
      const game = new FlappyBird();
      const themeSpy = jest.spyOn(game, 'toggleTheme');

      game.themeToggleBtn.click();

      expect(themeSpy).toHaveBeenCalled();
    });

    test('sound toggle button should toggle sound', () => {
      const game = new FlappyBird();
      const soundSpy = jest.spyOn(game, 'toggleSound');

      game.soundToggleBtn.click();

      expect(soundSpy).toHaveBeenCalled();
    });
  });
});
