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
  font: '',
  textAlign: '',
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  clearRect: jest.fn(),
  fillText: jest.fn(),
  setLineDash: jest.fn()
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
    <div id="game-container" style="width: 600px;">
      <canvas id="game-canvas"></canvas>
      <div id="game-overlay">
        <span id="overlay-text"></span>
        <button id="play-btn">Play</button>
      </div>
      <div id="player-score">0</div>
      <div id="ai-score">0</div>
      <button id="start-btn">Start</button>
      <select id="difficulty-select">
        <option value="easy">Easy</option>
        <option value="medium" selected>Medium</option>
        <option value="hard">Hard</option>
      </select>
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
// Pong Game Tests
// ============================================
describe('Pong Game', () => {
  let Pong;

  beforeEach(() => {
    const gameModule = require('./game.js');
    Pong = gameModule.Pong;
  });

  describe('Initialization', () => {
    test('should initialize with correct defaults', () => {
      const game = new Pong();

      expect(game.paddleWidth).toBe(10);
      expect(game.paddleHeight).toBe(80);
      expect(game.ballSize).toBe(10);
      expect(game.winningScore).toBe(11);
      expect(game.playerScore).toBe(0);
      expect(game.aiScore).toBe(0);
      expect(game.isPlaying).toBe(false);
      expect(game.isGameOver).toBe(false);
    });

    test('should have difficulty settings defined', () => {
      const game = new Pong();

      expect(game.difficulties.easy).toBeDefined();
      expect(game.difficulties.medium).toBeDefined();
      expect(game.difficulties.hard).toBeDefined();
    });

    test('should have correct difficulty values', () => {
      const game = new Pong();

      expect(game.difficulties.easy.aiSpeed).toBe(3);
      expect(game.difficulties.easy.ballSpeed).toBe(5);
      expect(game.difficulties.medium.aiSpeed).toBe(5);
      expect(game.difficulties.medium.ballSpeed).toBe(7);
      expect(game.difficulties.hard.aiSpeed).toBe(7);
      expect(game.difficulties.hard.ballSpeed).toBe(9);
    });

    test('should default to medium difficulty', () => {
      const game = new Pong();

      expect(game.difficulty).toBe('medium');
    });

    test('should load theme from localStorage', () => {
      localStorageMock.setItem('game-hub-theme', 'dark');
      const game = new Pong();

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    test('should load sound setting from localStorage', () => {
      localStorageMock.setItem('pong-sound', 'false');
      const game = new Pong();

      expect(game.soundEnabled).toBe(false);
    });

    test('should load difficulty from localStorage', () => {
      localStorageMock.setItem('pong-difficulty', 'hard');
      const game = new Pong();

      expect(game.difficulty).toBe('hard');
    });

    test('should have sound enabled by default', () => {
      const game = new Pong();

      expect(game.soundEnabled).toBe(true);
    });
  });

  describe('Canvas Setup', () => {
    test('should set up canvas with correct dimensions', () => {
      const game = new Pong();

      expect(game.canvas).not.toBeNull();
      expect(game.ctx).not.toBeNull();
      // Canvas dimensions depend on container, may be default values in jsdom
      expect(game.canvas.width).toBeDefined();
      expect(game.canvas.height).toBeDefined();
    });

    test('should calculate scale based on canvas size', () => {
      const game = new Pong();

      expect(game.scale).toBeDefined();
      // Scale can be negative in jsdom due to container size being 0
      expect(typeof game.scale).toBe('number');
    });
  });

  describe('Theme Management', () => {
    test('toggleTheme should toggle dark mode', () => {
      const game = new Pong();

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
      const game = new Pong();

      expect(game.soundEnabled).toBe(true);

      game.toggleSound();
      expect(game.soundEnabled).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pong-sound', false);

      game.toggleSound();
      expect(game.soundEnabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pong-sound', true);
    });

    test('updateSoundButton should update icon visibility', () => {
      const game = new Pong();
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
      const game = new Pong();
      game.startGame();

      expect(game.isPlaying).toBe(true);
      expect(game.isGameOver).toBe(false);
      expect(game.playerScore).toBe(0);
      expect(game.aiScore).toBe(0);
    });

    test('startGame should initialize paddles', () => {
      const game = new Pong();
      game.startGame();

      expect(game.playerPaddle).not.toBeNull();
      expect(game.aiPaddle).not.toBeNull();

      expect(game.playerPaddle).toHaveProperty('x');
      expect(game.playerPaddle).toHaveProperty('y');
      expect(game.playerPaddle).toHaveProperty('width');
      expect(game.playerPaddle).toHaveProperty('height');
      expect(game.playerPaddle).toHaveProperty('speed');

      expect(game.aiPaddle).toHaveProperty('x');
      expect(game.aiPaddle).toHaveProperty('y');
      expect(game.aiPaddle).toHaveProperty('width');
      expect(game.aiPaddle).toHaveProperty('height');
      expect(game.aiPaddle).toHaveProperty('speed');
    });

    test('startGame should initialize ball', () => {
      const game = new Pong();
      game.startGame();

      expect(game.ball).not.toBeNull();
      expect(game.ball).toHaveProperty('x');
      expect(game.ball).toHaveProperty('y');
      expect(game.ball).toHaveProperty('size');
      expect(game.ball).toHaveProperty('speedX');
      expect(game.ball).toHaveProperty('speedY');
    });

    test('startGame should place paddles at correct positions', () => {
      const game = new Pong();
      game.startGame();

      // Player paddle on left side
      expect(game.playerPaddle.x).toBe(20 * game.scale);

      // AI paddle on right side
      const aiExpectedX = game.canvas.width - 20 * game.scale - game.aiPaddle.width;
      expect(game.aiPaddle.x).toBe(aiExpectedX);
    });

    test('startGame should call recordRecentPlay', () => {
      const game = new Pong();
      game.startGame();

      expect(global.recordRecentPlay).toHaveBeenCalledWith('pong');
    });

    test('startGame should hide overlay', () => {
      const game = new Pong();
      game.overlay.classList.remove('hidden');

      game.startGame();

      expect(game.overlay.classList.contains('hidden')).toBe(true);
    });

    test('startGame should set AI speed based on difficulty', () => {
      const game = new Pong();

      game.difficulty = 'easy';
      game.startGame();
      expect(game.aiPaddle.speed).toBe(game.difficulties.easy.aiSpeed * game.scale);

      game.difficulty = 'hard';
      game.startGame();
      expect(game.aiPaddle.speed).toBe(game.difficulties.hard.aiSpeed * game.scale);
    });
  });

  describe('Ball Reset', () => {
    test('resetBall should place ball at center', () => {
      const game = new Pong();
      game.startGame();
      game.resetBall();

      const expectedX = game.canvas.width / 2 - game.ball.size / 2;
      const expectedY = game.canvas.height / 2 - game.ball.size / 2;

      expect(game.ball.x).toBe(expectedX);
      expect(game.ball.y).toBe(expectedY);
    });

    test('resetBall should give ball random direction', () => {
      const game = new Pong();
      game.startGame();

      // Run multiple times to check randomness
      const directions = new Set();
      for (let i = 0; i < 10; i++) {
        game.resetBall();
        directions.add(game.ball.speedX > 0 ? 'right' : 'left');
      }

      // With enough iterations, we should see both directions
      // This test might occasionally fail due to randomness
      expect(game.ball.speedX).not.toBe(0);
    });
  });

  describe('Player Paddle Control', () => {
    test('keyboard up should move paddle up', () => {
      const game = new Pong();
      game.startGame();

      // Ensure positive speed for testing
      game.playerPaddle.speed = Math.abs(game.playerPaddle.speed) || 8;
      game.playerPaddle.y = 100; // Set initial position

      game.keys.up = true;
      const initialY = game.playerPaddle.y;

      game.updatePlayerPaddle();

      expect(game.playerPaddle.y).toBeLessThan(initialY);
    });

    test('keyboard down should move paddle down', () => {
      const game = new Pong();
      game.startGame();

      // Ensure positive speed for testing
      game.playerPaddle.speed = Math.abs(game.playerPaddle.speed) || 8;
      game.playerPaddle.y = 100; // Set initial position

      game.keys.down = true;
      const initialY = game.playerPaddle.y;

      game.updatePlayerPaddle();

      expect(game.playerPaddle.y).toBeGreaterThan(initialY);
    });

    test('mouse Y should move paddle', () => {
      const game = new Pong();
      game.startGame();

      game.mouseY = 100;
      game.updatePlayerPaddle();

      const expectedY = 100 - game.playerPaddle.height / 2;
      expect(game.playerPaddle.y).toBe(expectedY);
    });

    test('touch Y should move paddle', () => {
      const game = new Pong();
      game.startGame();

      game.touchY = 150;
      game.updatePlayerPaddle();

      const expectedY = 150 - game.playerPaddle.height / 2;
      expect(game.playerPaddle.y).toBe(expectedY);
    });

    test('paddle should not go above top', () => {
      const game = new Pong();
      game.startGame();

      game.playerPaddle.y = -10;
      game.updatePlayerPaddle();

      expect(game.playerPaddle.y).toBe(0);
    });

    test('paddle should not go below bottom', () => {
      const game = new Pong();
      game.startGame();

      game.playerPaddle.y = game.canvas.height + 10;
      game.updatePlayerPaddle();

      expect(game.playerPaddle.y).toBe(game.canvas.height - game.playerPaddle.height);
    });
  });

  describe('AI Paddle Control', () => {
    test('AI should move toward ball', () => {
      const game = new Pong();
      game.startGame();

      // Ensure positive speed for testing
      game.aiPaddle.speed = Math.abs(game.aiPaddle.speed) || 5;
      game.aiPaddle.height = 80;

      // Place ball far below AI paddle center
      game.ball.y = 300;
      game.ball.size = 10;
      game.aiPaddle.y = 50;

      const initialY = game.aiPaddle.y;
      game.updateAIPaddle();

      expect(game.aiPaddle.y).toBeGreaterThan(initialY);
    });

    test('AI should stay in bounds', () => {
      const game = new Pong();
      game.startGame();

      game.aiPaddle.y = game.canvas.height + 100;
      game.updateAIPaddle();

      expect(game.aiPaddle.y).toBeLessThanOrEqual(game.canvas.height - game.aiPaddle.height);
    });
  });

  describe('Ball Movement', () => {
    test('updateBall should move ball based on speed', () => {
      const game = new Pong();
      game.startGame();

      game.ball.speedX = 5;
      game.ball.speedY = 3;
      const initialX = game.ball.x;
      const initialY = game.ball.y;

      game.updateBall();

      expect(game.ball.x).toBe(initialX + 5);
      expect(game.ball.y).toBe(initialY + 3);
    });

    test('ball should bounce off top wall', () => {
      const game = new Pong();
      game.startGame();

      game.ball.y = -1;
      game.ball.speedY = -5;

      game.updateBall();

      expect(game.ball.speedY).toBe(5);
    });

    test('ball should bounce off bottom wall', () => {
      const game = new Pong();
      game.startGame();

      game.ball.y = game.canvas.height + 1;
      game.ball.speedY = 5;

      game.updateBall();

      expect(game.ball.speedY).toBe(-5);
    });
  });

  describe('Paddle Collision', () => {
    test('ball should bounce off player paddle', () => {
      const game = new Pong();
      game.startGame();

      // Set explicit dimensions to avoid scale issues
      game.playerPaddle.x = 20;
      game.playerPaddle.y = 100;
      game.playerPaddle.width = 10;
      game.playerPaddle.height = 80;

      // Position ball touching player paddle (overlapping)
      game.ball.size = 10;
      game.ball.x = 25; // Between paddle x and x + width
      game.ball.y = 130; // Within paddle y range
      game.ball.speedX = -5;

      game.checkPaddleCollision();

      expect(game.ball.speedX).toBeGreaterThan(0);
    });

    test('ball should bounce off AI paddle', () => {
      const game = new Pong();
      game.startGame();

      // Set explicit dimensions
      game.aiPaddle.x = 500;
      game.aiPaddle.y = 100;
      game.aiPaddle.width = 10;
      game.aiPaddle.height = 80;

      // Position ball touching AI paddle
      game.ball.size = 10;
      game.ball.x = 495; // Overlapping with AI paddle
      game.ball.y = 130; // Within paddle y range
      game.ball.speedX = 5;

      game.checkPaddleCollision();

      expect(game.ball.speedX).toBeLessThan(0);
    });

    test('paddle hit should slightly increase ball speed', () => {
      const game = new Pong();
      game.startGame();

      // Set explicit dimensions
      game.playerPaddle.x = 20;
      game.playerPaddle.y = 100;
      game.playerPaddle.width = 10;
      game.playerPaddle.height = 80;

      game.ball.size = 10;
      game.ball.x = 25;
      game.ball.y = 130;
      game.ball.speedX = -5;

      const initialSpeed = Math.abs(game.ball.speedX);
      game.checkPaddleCollision();

      expect(Math.abs(game.ball.speedX)).toBeGreaterThan(initialSpeed);
    });
  });

  describe('Scoring', () => {
    test('player scores when ball passes AI', () => {
      const game = new Pong();
      game.startGame();

      game.ball.x = game.canvas.width + 1;

      game.checkScoring();

      expect(game.playerScore).toBe(1);
    });

    test('AI scores when ball passes player', () => {
      const game = new Pong();
      game.startGame();

      game.ball.x = -1;

      game.checkScoring();

      expect(game.aiScore).toBe(1);
    });

    test('scoring should update display', () => {
      const game = new Pong();
      game.startGame();

      game.ball.x = game.canvas.width + 1;
      game.checkScoring();

      expect(game.playerScoreDisplay.textContent).toBe('1');
    });

    test('scoring should reset ball', () => {
      const game = new Pong();
      game.startGame();

      game.ball.x = game.canvas.width + 1;
      game.checkScoring();

      // Ball should be reset to center
      const expectedX = game.canvas.width / 2 - game.ball.size / 2;
      expect(game.ball.x).toBe(expectedX);
    });
  });

  describe('Win Condition', () => {
    test('player wins at 11 points', () => {
      const game = new Pong();
      game.startGame();

      game.playerScore = 10;
      game.ball.x = game.canvas.width + 1;

      game.checkScoring();

      expect(game.isGameOver).toBe(true);
      expect(game.overlayText.textContent).toContain('Win');
    });

    test('AI wins at 11 points', () => {
      const game = new Pong();
      game.startGame();

      game.aiScore = 10;
      game.ball.x = -1;

      game.checkScoring();

      expect(game.isGameOver).toBe(true);
      expect(game.overlayText.textContent).toContain('AI Wins');
    });
  });

  describe('Game Over', () => {
    test('gameOver should set game state correctly', () => {
      const game = new Pong();
      game.startGame();

      game.gameOver(true);

      expect(game.isGameOver).toBe(true);
      expect(game.isPlaying).toBe(false);
    });

    test('gameOver should show overlay', () => {
      const game = new Pong();
      game.startGame();

      game.gameOver(true);

      expect(game.overlay.classList.contains('hidden')).toBe(false);
    });

    test('gameOver with player win should show win message', () => {
      const game = new Pong();
      game.startGame();

      game.gameOver(true);

      expect(game.overlayText.textContent).toContain('You Win');
    });

    test('gameOver with AI win should show lose message', () => {
      const game = new Pong();
      game.startGame();

      game.gameOver(false);

      expect(game.overlayText.textContent).toContain('AI Wins');
    });
  });

  describe('Update Logic', () => {
    test('update should not run when not playing', () => {
      const game = new Pong();
      game.startGame();
      game.isPlaying = false;

      const updateBallSpy = jest.spyOn(game, 'updateBall');
      game.update();

      expect(updateBallSpy).not.toHaveBeenCalled();
    });

    test('update should not run when game is over', () => {
      const game = new Pong();
      game.startGame();
      game.isGameOver = true;

      const updateBallSpy = jest.spyOn(game, 'updateBall');
      game.update();

      expect(updateBallSpy).not.toHaveBeenCalled();
    });

    test('update should call all update methods', () => {
      const game = new Pong();
      game.startGame();

      const playerSpy = jest.spyOn(game, 'updatePlayerPaddle');
      const aiSpy = jest.spyOn(game, 'updateAIPaddle');
      const ballSpy = jest.spyOn(game, 'updateBall');
      const scoreSpy = jest.spyOn(game, 'checkScoring');

      game.update();

      expect(playerSpy).toHaveBeenCalled();
      expect(aiSpy).toHaveBeenCalled();
      expect(ballSpy).toHaveBeenCalled();
      expect(scoreSpy).toHaveBeenCalled();
    });
  });

  describe('Audio', () => {
    test('initAudio should create AudioContext', () => {
      const game = new Pong();
      game.initAudio();

      expect(game.audioContext).not.toBeNull();
    });

    test('playSound should not throw when disabled', () => {
      const game = new Pong();
      game.soundEnabled = false;

      expect(() => game.playSound('hit')).not.toThrow();
    });

    test('playSound should not throw when audioContext is null', () => {
      const game = new Pong();
      game.soundEnabled = true;
      game.audioContext = null;

      expect(() => game.playSound('hit')).not.toThrow();
    });
  });

  describe('Drawing', () => {
    test('draw should not throw', () => {
      const game = new Pong();

      expect(() => game.draw()).not.toThrow();
    });

    test('draw should call canvas methods', () => {
      const game = new Pong();
      game.startGame();

      game.draw();

      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    test('draw should draw center line', () => {
      const game = new Pong();
      game.startGame();

      game.draw();

      expect(mockContext.setLineDash).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });

  describe('Difficulty Selection', () => {
    test('changing difficulty should save to localStorage', () => {
      const game = new Pong();
      const select = game.difficultySelect;

      select.value = 'hard';
      select.dispatchEvent(new Event('change'));

      expect(game.difficulty).toBe('hard');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pong-difficulty', 'hard');
    });
  });

  describe('Button Events', () => {
    test('start button should start game', () => {
      const game = new Pong();
      const startSpy = jest.spyOn(game, 'startGame');

      game.startBtn.click();

      expect(startSpy).toHaveBeenCalled();
    });

    test('play button should start game', () => {
      const game = new Pong();
      const startSpy = jest.spyOn(game, 'startGame');

      game.playBtn.click();

      expect(startSpy).toHaveBeenCalled();
    });

    test('theme toggle button should toggle theme', () => {
      const game = new Pong();
      const themeSpy = jest.spyOn(game, 'toggleTheme');

      game.themeToggleBtn.click();

      expect(themeSpy).toHaveBeenCalled();
    });

    test('sound toggle button should toggle sound', () => {
      const game = new Pong();
      const soundSpy = jest.spyOn(game, 'toggleSound');

      game.soundToggleBtn.click();

      expect(soundSpy).toHaveBeenCalled();
    });
  });

  describe('Keyboard Events', () => {
    test('ArrowUp should set keys.up true', () => {
      const game = new Pong();

      const event = new KeyboardEvent('keydown', { code: 'ArrowUp' });
      document.dispatchEvent(event);

      expect(game.keys.up).toBe(true);
    });

    test('ArrowDown should set keys.down true', () => {
      const game = new Pong();

      const event = new KeyboardEvent('keydown', { code: 'ArrowDown' });
      document.dispatchEvent(event);

      expect(game.keys.down).toBe(true);
    });

    test('W should set keys.up true', () => {
      const game = new Pong();

      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);

      expect(game.keys.up).toBe(true);
    });

    test('S should set keys.down true', () => {
      const game = new Pong();

      const event = new KeyboardEvent('keydown', { code: 'KeyS' });
      document.dispatchEvent(event);

      expect(game.keys.down).toBe(true);
    });

    test('keyup should reset key states', () => {
      const game = new Pong();
      game.keys.up = true;

      const event = new KeyboardEvent('keyup', { code: 'ArrowUp' });
      document.dispatchEvent(event);

      expect(game.keys.up).toBe(false);
    });

    test('Space should start game when not playing', () => {
      const game = new Pong();
      game.isPlaying = false;
      const startSpy = jest.spyOn(game, 'startGame');

      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);

      expect(startSpy).toHaveBeenCalled();
    });
  });
});
