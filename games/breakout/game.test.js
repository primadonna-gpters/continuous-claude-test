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

// Mock requestAnimationFrame
window.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 16));
window.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

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
    exponentialDecayTo: 0.01
  }
};

const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  resume: jest.fn(),
  createOscillator: jest.fn(() => ({...mockOscillator})),
  createGain: jest.fn(() => ({...mockGainNode, gain: {...mockGainNode.gain}}))
};

window.AudioContext = jest.fn(() => mockAudioContext);
window.webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock canvas
const mockCanvasContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  scale: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  fillStyle: '',
  strokeStyle: ''
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  jest.useFakeTimers();

  document.body.innerHTML = `
    <div id="game-container" style="width: 480px; height: 400px;">
      <canvas id="game-canvas" width="480" height="400"></canvas>
    </div>
    <div id="start-message"></div>
    <div id="game-message" class="hidden">
      <p></p>
      <button id="retry-btn">Try Again</button>
    </div>
    <div id="score">0</div>
    <div id="best-score">0</div>
    <div id="level">1</div>
    <div id="lives">3</div>
    <button id="new-game-btn">New Game</button>
    <button id="pause-btn">⏸️</button>
    <button id="theme-toggle-btn">🌙</button>
    <button id="sound-toggle-btn">
      <span class="sound-on-icon" style="display: inline;">🔊</span>
      <span class="sound-off-icon" style="display: none;">🔇</span>
    </button>
    <button class="control-btn" data-action="left">Left</button>
    <button class="control-btn" data-action="right">Right</button>
    <button class="control-btn" data-action="launch">Launch</button>
  `;

  // Mock getBoundingClientRect
  document.getElementById('game-container').getBoundingClientRect = jest.fn(() => ({
    width: 480,
    height: 400,
    left: 0,
    top: 0
  }));

  document.getElementById('game-canvas').getBoundingClientRect = jest.fn(() => ({
    width: 480,
    height: 400,
    left: 0,
    top: 0
  }));

  document.body.classList.remove('dark-mode');
  jest.resetModules();
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================
// BreakoutGame Tests
// ============================================
describe('BreakoutGame', () => {
  let BreakoutGame, game;

  beforeEach(() => {
    const gameModule = require('./game.js');
    BreakoutGame = gameModule?.BreakoutGame || global.BreakoutGame || window.BreakoutGame;
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      game = new BreakoutGame();

      expect(game.baseWidth).toBe(480);
      expect(game.baseHeight).toBe(400);
      expect(game.gameStarted).toBe(false);
      expect(game.gameOver).toBe(false);
      expect(game.isPaused).toBe(false);
      expect(game.score).toBe(0);
      expect(game.level).toBe(1);
      expect(game.lives).toBe(3);
    });

    test('should load best score from localStorage', () => {
      localStorageMock.setItem('breakout-best-score', '1500');
      game = new BreakoutGame();

      expect(game.bestScore).toBe(1500);
    });

    test('should initialize bricks correctly', () => {
      game = new BreakoutGame();

      expect(game.bricks.length).toBe(game.brickRowCount);
      expect(game.bricks[0].length).toBe(game.brickColumnCount);

      // Check all bricks are active
      for (let r = 0; r < game.brickRowCount; r++) {
        for (let c = 0; c < game.brickColumnCount; c++) {
          expect(game.bricks[r][c].status).toBe(1);
        }
      }
    });

    test('should set brick positions correctly', () => {
      game = new BreakoutGame();

      const firstBrick = game.bricks[0][0];
      expect(firstBrick.x).toBe(game.brickOffsetLeft);
      expect(firstBrick.y).toBe(game.brickOffsetTop);

      const secondBrick = game.bricks[0][1];
      expect(secondBrick.x).toBe(game.brickOffsetLeft + game.brickWidth + game.brickPadding);
    });

    test('should set paddle position at center', () => {
      game = new BreakoutGame();

      expect(game.paddleX).toBe((game.baseWidth - game.paddleWidth) / 2);
    });

    test('should set ball position correctly', () => {
      game = new BreakoutGame();

      expect(game.ballX).toBe(game.baseWidth / 2);
      expect(game.ballY).toBe(game.baseHeight - 50);
      expect(game.ballAttached).toBe(true);
    });
  });

  describe('Paddle Movement', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('should move paddle left when key pressed', () => {
      const initialX = game.paddleX;
      game.paddleMoving = -1;
      game.update();

      expect(game.paddleX).toBe(initialX - game.paddleSpeed);
    });

    test('should move paddle right when key pressed', () => {
      const initialX = game.paddleX;
      game.paddleMoving = 1;
      game.update();

      expect(game.paddleX).toBe(initialX + game.paddleSpeed);
    });

    test('should not move paddle beyond left boundary', () => {
      game.paddleX = 0;
      game.paddleMoving = -1;
      game.update();

      expect(game.paddleX).toBe(0);
    });

    test('should not move paddle beyond right boundary', () => {
      game.paddleX = game.baseWidth - game.paddleWidth;
      game.paddleMoving = 1;
      game.update();

      expect(game.paddleX).toBe(game.baseWidth - game.paddleWidth);
    });

    test('handleKeyDown should set paddle moving left', () => {
      game.handleKeyDown({ key: 'ArrowLeft' });
      expect(game.paddleMoving).toBe(-1);

      game.handleKeyUp({ key: 'ArrowLeft' });
      game.handleKeyDown({ key: 'a' });
      expect(game.paddleMoving).toBe(-1);

      game.handleKeyUp({ key: 'a' });
      game.handleKeyDown({ key: 'A' });
      expect(game.paddleMoving).toBe(-1);
    });

    test('handleKeyDown should set paddle moving right', () => {
      game.handleKeyDown({ key: 'ArrowRight' });
      expect(game.paddleMoving).toBe(1);

      game.handleKeyUp({ key: 'ArrowRight' });
      game.handleKeyDown({ key: 'd' });
      expect(game.paddleMoving).toBe(1);

      game.handleKeyUp({ key: 'd' });
      game.handleKeyDown({ key: 'D' });
      expect(game.paddleMoving).toBe(1);
    });

    test('handleKeyUp should stop paddle movement', () => {
      game.paddleMoving = -1;
      game.handleKeyUp({ key: 'ArrowLeft' });
      expect(game.paddleMoving).toBe(0);

      game.paddleMoving = 1;
      game.handleKeyUp({ key: 'ArrowRight' });
      expect(game.paddleMoving).toBe(0);
    });
  });

  describe('Ball Movement', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('ball should follow paddle when attached', () => {
      game.ballAttached = true;
      game.paddleX = 100;
      game.update();

      expect(game.ballX).toBe(100 + game.paddleWidth / 2);
    });

    test('ball should move independently when launched', () => {
      game.ballAttached = false;
      game.ballSpeedX = 3;
      game.ballSpeedY = -4;
      const initialX = game.ballX;
      const initialY = game.ballY;

      game.update();

      expect(game.ballX).toBe(initialX + 3);
      expect(game.ballY).toBe(initialY - 4);
    });

    test('ball should bounce off left wall', () => {
      game.ballAttached = false;
      game.ballX = game.ballRadius - 1;
      game.ballSpeedX = -5;
      game.ballSpeedY = -3;

      game.update();

      expect(game.ballSpeedX).toBe(5);
    });

    test('ball should bounce off right wall', () => {
      game.ballAttached = false;
      game.ballX = game.baseWidth - game.ballRadius + 1;
      game.ballSpeedX = 5;
      game.ballSpeedY = -3;

      game.update();

      expect(game.ballSpeedX).toBe(-5);
    });

    test('ball should bounce off top wall', () => {
      game.ballAttached = false;
      game.ballY = game.ballRadius - 1;
      game.ballSpeedX = 3;
      game.ballSpeedY = -5;

      game.update();

      expect(game.ballSpeedY).toBe(5);
    });
  });

  describe('Ball Launch', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('launchBall should set ball speed', () => {
      game.ballAttached = true;
      game.launchBall();

      expect(game.ballAttached).toBe(false);
      expect(game.ballSpeedY).toBeLessThan(0);
    });

    test('launchBall should not do anything if ball already launched', () => {
      game.ballAttached = false;
      game.ballSpeedX = 3;
      game.ballSpeedY = -4;
      const originalSpeedX = game.ballSpeedX;
      const originalSpeedY = game.ballSpeedY;

      game.launchBall();

      expect(game.ballSpeedX).toBe(originalSpeedX);
      expect(game.ballSpeedY).toBe(originalSpeedY);
    });

    test('spacebar should launch ball when attached', () => {
      game.ballAttached = true;
      game.handleKeyDown({ key: ' ', preventDefault: jest.fn() });

      expect(game.ballAttached).toBe(false);
    });
  });

  describe('Brick Collision', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
      game.ballAttached = false;
    });

    test('should destroy brick on collision', () => {
      const brick = game.bricks[0][0];
      game.ballX = brick.x + game.brickWidth / 2;
      game.ballY = brick.y + game.brickHeight / 2;
      game.ballSpeedX = 0;
      game.ballSpeedY = -5;

      game.checkBrickCollision();

      expect(brick.status).toBe(0);
    });

    test('should increment score on brick collision', () => {
      const brick = game.bricks[0][0];
      game.ballX = brick.x + game.brickWidth / 2;
      game.ballY = brick.y + game.brickHeight / 2;
      game.ballSpeedX = 0;
      game.ballSpeedY = -5;

      game.checkBrickCollision();

      expect(game.score).toBeGreaterThan(0);
    });

    test('should reverse ball direction on brick collision (Y bounce)', () => {
      const brick = game.bricks[0][5];
      game.ballX = brick.x + game.brickWidth / 2;
      game.ballY = brick.y + 1;
      game.ballSpeedX = 0;
      game.ballSpeedY = 5;

      game.checkBrickCollision();

      expect(game.ballSpeedY).toBe(-5);
    });

    test('higher rows should be worth more points', () => {
      game.score = 0;
      const topBrick = game.bricks[0][0];
      game.ballX = topBrick.x + game.brickWidth / 2;
      game.ballY = topBrick.y + game.brickHeight / 2;
      game.checkBrickCollision();
      const topRowScore = game.score;

      // Reset for bottom row
      game = new BreakoutGame();
      game.gameStarted = true;
      game.ballAttached = false;
      game.score = 0;

      const bottomBrick = game.bricks[game.brickRowCount - 1][0];
      game.ballX = bottomBrick.x + game.brickWidth / 2;
      game.ballY = bottomBrick.y + game.brickHeight / 2;
      game.checkBrickCollision();
      const bottomRowScore = game.score;

      expect(topRowScore).toBeGreaterThan(bottomRowScore);
    });
  });

  describe('Level Completion', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('isLevelComplete should return false when bricks remain', () => {
      expect(game.isLevelComplete()).toBe(false);
    });

    test('isLevelComplete should return true when all bricks destroyed', () => {
      for (let r = 0; r < game.brickRowCount; r++) {
        for (let c = 0; c < game.brickColumnCount; c++) {
          game.bricks[r][c].status = 0;
        }
      }

      expect(game.isLevelComplete()).toBe(true);
    });

    test('nextLevel should increase level and reset bricks', () => {
      for (let r = 0; r < game.brickRowCount; r++) {
        for (let c = 0; c < game.brickColumnCount; c++) {
          game.bricks[r][c].status = 0;
        }
      }
      game.level = 1;
      game.nextLevel();

      expect(game.level).toBe(2);
      expect(game.bricks[0][0].status).toBe(1);
      expect(game.ballAttached).toBe(true);
    });
  });

  describe('Lives and Game Over', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
      game.ballAttached = false;
    });

    test('should lose a life when ball goes out of bounds', () => {
      game.lives = 3;
      game.ballY = game.baseHeight + game.ballRadius + 10;
      game.ballSpeedY = 5;

      game.update();

      expect(game.lives).toBe(2);
    });

    test('should reset ball after losing a life', () => {
      game.lives = 3;
      game.ballY = game.baseHeight + game.ballRadius + 10;
      game.ballSpeedY = 5;

      game.update();

      expect(game.ballAttached).toBe(true);
    });

    test('should end game when no lives left', () => {
      game.lives = 1;
      game.ballY = game.baseHeight + game.ballRadius + 10;
      game.ballSpeedY = 5;

      game.update();

      expect(game.lives).toBe(0);
      expect(game.gameOver).toBe(true);
    });

    test('should update best score on game over if new high score', () => {
      game.bestScore = 100;
      game.score = 200;
      game.endGame(false);

      expect(game.bestScore).toBe(200);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('breakout-best-score', '200');
    });

    test('should not update best score if not a high score', () => {
      game.bestScore = 300;
      game.score = 200;
      game.endGame(false);

      expect(game.bestScore).toBe(300);
    });
  });

  describe('Paddle Collision', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
      game.ballAttached = false;
    });

    test('ball should bounce off paddle', () => {
      game.paddleX = 200;
      game.ballX = game.paddleX + game.paddleWidth / 2;
      game.ballY = game.baseHeight - game.paddleHeight - 10 - game.ballRadius + 5;
      game.ballSpeedX = 0;
      game.ballSpeedY = 5;

      game.update();

      expect(game.ballSpeedY).toBeLessThan(0);
    });
  });

  describe('Pause', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('togglePause should pause and unpause game', () => {
      expect(game.isPaused).toBe(false);

      game.togglePause();
      expect(game.isPaused).toBe(true);

      game.togglePause();
      expect(game.isPaused).toBe(false);
    });

    test('should not update when paused', () => {
      game.isPaused = true;
      game.ballAttached = false;
      game.ballSpeedX = 5;
      const initialX = game.ballX;

      game.update();

      expect(game.ballX).toBe(initialX);
    });

    test('P key should toggle pause', () => {
      game.handleKeyDown({ key: 'p' });
      expect(game.isPaused).toBe(true);

      game.handleKeyDown({ key: 'P' });
      expect(game.isPaused).toBe(false);
    });

    test('togglePause should do nothing if game not started', () => {
      game.gameStarted = false;
      game.isPaused = false;
      game.togglePause();

      expect(game.isPaused).toBe(false);
    });

    test('togglePause should do nothing if game over', () => {
      game.gameOver = true;
      game.isPaused = false;
      game.togglePause();

      expect(game.isPaused).toBe(false);
    });
  });

  describe('Game Start and New Game', () => {
    beforeEach(() => {
      game = new BreakoutGame();
    });

    test('startGame should initialize game state', () => {
      game.startGame();

      expect(game.gameStarted).toBe(true);
      expect(game.gameOver).toBe(false);
      expect(game.score).toBe(0);
      expect(game.level).toBe(1);
      expect(game.lives).toBe(3);
    });

    test('startGame should call recordRecentPlay', () => {
      game.startGame();
      expect(global.recordRecentPlay).toHaveBeenCalledWith('breakout');
    });

    test('newGame should hide game message and start game', () => {
      document.getElementById('game-message').classList.remove('hidden');

      game.newGame();

      expect(document.getElementById('game-message').classList.contains('hidden')).toBe(true);
      expect(game.gameStarted).toBe(true);
    });

    test('spacebar should start game when not started', () => {
      game.gameStarted = false;
      game.handleKeyDown({ key: ' ', preventDefault: jest.fn() });

      expect(game.gameStarted).toBe(true);
    });

    test('click should start game when not started', () => {
      game.gameStarted = false;
      game.handleClick();

      expect(game.gameStarted).toBe(true);
    });
  });

  describe('Mouse and Touch Controls', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('mouse move should control paddle position', () => {
      const event = {
        clientX: 200
      };
      game.handleMouseMove(event);

      expect(game.paddleX).toBe(200 - game.paddleWidth / 2);
    });

    test('mouse move should not update paddle when paused', () => {
      game.isPaused = true;
      const initialX = game.paddleX;
      const event = { clientX: 200 };

      game.handleMouseMove(event);

      expect(game.paddleX).toBe(initialX);
    });

    test('touch move should control paddle position', () => {
      const event = {
        touches: [{ clientX: 200 }],
        preventDefault: jest.fn()
      };
      game.handleTouchMove(event);

      expect(game.paddleX).toBe(200 - game.paddleWidth / 2);
    });

    test('touch start should start or launch game', () => {
      game.gameStarted = false;
      game.handleTouchStart({});

      expect(game.gameStarted).toBe(true);
    });

    test('paddle should clamp to canvas bounds on mouse move', () => {
      const event = { clientX: -100 };
      game.handleMouseMove(event);
      expect(game.paddleX).toBe(0);

      const event2 = { clientX: 600 };
      game.handleMouseMove(event2);
      expect(game.paddleX).toBe(game.baseWidth - game.paddleWidth);
    });
  });

  describe('Mobile Controls', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('mobile left control should move paddle left', () => {
      game.handleMobileControl('left', true);
      expect(game.paddleMoving).toBe(-1);

      game.handleMobileControl('left', false);
      expect(game.paddleMoving).toBe(0);
    });

    test('mobile right control should move paddle right', () => {
      game.handleMobileControl('right', true);
      expect(game.paddleMoving).toBe(1);

      game.handleMobileControl('right', false);
      expect(game.paddleMoving).toBe(0);
    });

    test('mobile launch control should launch ball', () => {
      game.ballAttached = true;
      game.handleMobileControl('launch', true);

      expect(game.ballAttached).toBe(false);
    });

    test('mobile launch control should start game if not started', () => {
      game.gameStarted = false;
      game.handleMobileControl('launch', true);

      expect(game.gameStarted).toBe(true);
    });
  });

  describe('Theme', () => {
    beforeEach(() => {
      game = new BreakoutGame();
    });

    test('applyTheme should apply dark mode from localStorage', () => {
      localStorageMock.setItem('game-hub-theme', 'dark');
      document.body.classList.remove('dark-mode');

      game.applyTheme();

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
      game = new BreakoutGame();
    });

    test('sound should be enabled by default', () => {
      expect(game.soundEnabled).toBe(true);
    });

    test('should load sound setting from localStorage', () => {
      localStorageMock.setItem('breakout-sound', 'false');
      jest.resetModules();
      const newGame = new BreakoutGame();

      expect(newGame.soundEnabled).toBe(false);
    });

    test('toggleSound should toggle sound state', () => {
      expect(game.soundEnabled).toBe(true);

      game.toggleSound();
      expect(game.soundEnabled).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('breakout-sound', 'false');

      game.toggleSound();
      expect(game.soundEnabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('breakout-sound', 'true');
    });

    test('playSound should not play when disabled', () => {
      game.soundEnabled = false;
      const audioContextSpy = jest.spyOn(window, 'AudioContext');

      game.playSound('brick');

      expect(audioContextSpy).not.toHaveBeenCalled();
    });

    test('playSound should initialize AudioContext when enabled', () => {
      game.soundEnabled = true;
      game.audioContext = null;

      game.playSound('brick');

      expect(window.AudioContext).toHaveBeenCalled();
    });
  });

  describe('Reset Ball', () => {
    beforeEach(() => {
      game = new BreakoutGame();
      game.gameStarted = true;
    });

    test('resetBall should position ball on paddle', () => {
      game.paddleX = 200;
      game.ballX = 100;
      game.ballY = 100;
      game.ballSpeedX = 5;
      game.ballSpeedY = 5;
      game.ballAttached = false;

      game.resetBall();

      expect(game.ballX).toBe(200 + game.paddleWidth / 2);
      expect(game.ballY).toBe(game.baseHeight - 50);
      expect(game.ballSpeedX).toBe(0);
      expect(game.ballSpeedY).toBe(0);
      expect(game.ballAttached).toBe(true);
    });
  });

  describe('UI Updates', () => {
    beforeEach(() => {
      game = new BreakoutGame();
    });

    test('updateUI should update score display', () => {
      game.score = 500;
      game.bestScore = 1000;
      game.level = 3;
      game.lives = 2;

      game.updateUI();

      expect(document.getElementById('score').textContent).toBe('500');
      expect(document.getElementById('best-score').textContent).toBe('1000');
      expect(document.getElementById('level').textContent).toBe('3');
      expect(document.getElementById('lives').textContent).toBe('2');
    });
  });

  describe('Draw Functions', () => {
    beforeEach(() => {
      game = new BreakoutGame();
    });

    test('draw should call canvas context methods', () => {
      game.draw();

      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.arc).toHaveBeenCalled();
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });

    test('roundRect should draw rounded rectangle path', () => {
      game.roundRect(10, 10, 50, 20, 5);

      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
      expect(mockCanvasContext.quadraticCurveTo).toHaveBeenCalled();
    });
  });

  describe('Resize', () => {
    test('resizeCanvas should update canvas dimensions', () => {
      game = new BreakoutGame();
      const canvas = game.canvas;

      document.getElementById('game-container').getBoundingClientRect = jest.fn(() => ({
        width: 960,
        height: 800
      }));

      game.resizeCanvas();

      expect(game.scale).toBe(2);
      expect(canvas.width).toBe(960);
      expect(canvas.height).toBe(800);
    });
  });
});

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  // Nothing to export as BreakoutGame is instantiated globally
}
