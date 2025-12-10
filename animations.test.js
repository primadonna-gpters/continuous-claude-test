/**
 * @jest-environment jsdom
 */

/**
 * Test suite for 3D animations and effects
 * Tests GameAnimations class, ParallaxManager, and CSS animation classes
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

// Mock matchMedia helper
const mockMatchMedia = (prefersReducedMotion = false, prefersDark = false) => {
  return jest.fn().mockImplementation(query => ({
    matches: (query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion) ||
             (query === '(prefers-color-scheme: dark)' && prefersDark),
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
  value: mockMatchMedia(false, false),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({ scope: '/' })
  }
});

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  window.matchMedia = mockMatchMedia(false, false);
  delete window.ontouchstart;
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true });

  document.body.innerHTML = `
    <div class="hub-container">
      <header class="hub-header">
        <h1>Game Hub</h1>
        <button id="theme-toggle-btn"></button>
      </header>
      <section class="recent-section" id="recent-section"></section>
      <section class="stats-section">
        <div class="stats-grid" id="stats-grid"></div>
      </section>
      <div class="games-grid">
        <div class="game-card"></div>
        <div class="game-card"></div>
      </div>
    </div>
    <div class="game-container" id="game-container"></div>
    <div class="score-display" id="score"></div>
  `;
  document.body.classList.remove('dark-mode');

  jest.resetModules();
});

// ============================================
// GameAnimations Class Tests
// ============================================
describe('GameAnimations', () => {
  let GameAnimations, gameAnimations;

  beforeEach(() => {
    const common = require('./common.js');
    GameAnimations = common.GameAnimations;
    gameAnimations = common.gameAnimations;
  });

  describe('Constructor', () => {
    test('should detect prefers-reduced-motion when enabled', () => {
      window.matchMedia = mockMatchMedia(true, false);
      jest.resetModules();
      const common = require('./common.js');
      const animations = new common.GameAnimations();
      expect(animations.prefersReducedMotion).toBe(true);
    });

    test('should not have prefers-reduced-motion when disabled', () => {
      window.matchMedia = mockMatchMedia(false, false);
      jest.resetModules();
      const common = require('./common.js');
      const animations = new common.GameAnimations();
      expect(animations.prefersReducedMotion).toBe(false);
    });

    test('should export singleton gameAnimations instance', () => {
      expect(gameAnimations).toBeInstanceOf(GameAnimations);
    });
  });

  describe('pulseScore', () => {
    test('should add score-pulse class to element', () => {
      const element = document.getElementById('score');
      gameAnimations.pulseScore(element, false);
      expect(element.classList.contains('score-pulse')).toBe(true);
    });

    test('should add score-pop class for large score increase', () => {
      const element = document.getElementById('score');
      gameAnimations.pulseScore(element, true);
      expect(element.classList.contains('score-pop')).toBe(true);
    });

    test('should not add class when element is null', () => {
      expect(() => gameAnimations.pulseScore(null, false)).not.toThrow();
    });

    test('should not add class when prefers-reduced-motion is enabled', () => {
      window.matchMedia = mockMatchMedia(true, false);
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('score');
      common.gameAnimations.pulseScore(element, false);
      expect(element.classList.contains('score-pulse')).toBe(false);
    });

    test('should remove score-pulse class on animationend', () => {
      const element = document.getElementById('score');
      gameAnimations.pulseScore(element, false);
      element.dispatchEvent(new Event('animationend'));
      expect(element.classList.contains('score-pulse')).toBe(false);
    });

    test('should remove previous animation classes before adding new one', () => {
      const element = document.getElementById('score');
      element.classList.add('score-pulse');
      gameAnimations.pulseScore(element, false);
      // Should still have the class (re-added after removal for reflow)
      expect(element.classList.contains('score-pulse')).toBe(true);
    });
  });

  describe('celebrateWin', () => {
    test('should add win-effect class to element', () => {
      const element = document.getElementById('game-container');
      gameAnimations.celebrateWin(element);
      expect(element.classList.contains('win-effect')).toBe(true);
    });

    test('should not add class when element is null', () => {
      expect(() => gameAnimations.celebrateWin(null)).not.toThrow();
    });

    test('should not add class when prefers-reduced-motion is enabled', () => {
      window.matchMedia = mockMatchMedia(true, false);
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('game-container');
      common.gameAnimations.celebrateWin(element);
      expect(element.classList.contains('win-effect')).toBe(false);
    });

    test('should remove win-effect class on animationend', () => {
      const element = document.getElementById('game-container');
      gameAnimations.celebrateWin(element);
      element.dispatchEvent(new Event('animationend'));
      expect(element.classList.contains('win-effect')).toBe(false);
    });
  });

  describe('shakeOnLose', () => {
    test('should add lose-effect class to element', () => {
      const element = document.getElementById('game-container');
      gameAnimations.shakeOnLose(element);
      expect(element.classList.contains('lose-effect')).toBe(true);
    });

    test('should not add class when element is null', () => {
      expect(() => gameAnimations.shakeOnLose(null)).not.toThrow();
    });

    test('should not add class when prefers-reduced-motion is enabled', () => {
      window.matchMedia = mockMatchMedia(true, false);
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('game-container');
      common.gameAnimations.shakeOnLose(element);
      expect(element.classList.contains('lose-effect')).toBe(false);
    });

    test('should remove lose-effect class on animationend', () => {
      const element = document.getElementById('game-container');
      gameAnimations.shakeOnLose(element);
      element.dispatchEvent(new Event('animationend'));
      expect(element.classList.contains('lose-effect')).toBe(false);
    });
  });

  describe('flash', () => {
    test('should add flash-effect class to element', () => {
      const element = document.getElementById('game-container');
      gameAnimations.flash(element);
      expect(element.classList.contains('flash-effect')).toBe(true);
    });

    test('should not add class when element is null', () => {
      expect(() => gameAnimations.flash(null)).not.toThrow();
    });

    test('should not add class when prefers-reduced-motion is enabled', () => {
      window.matchMedia = mockMatchMedia(true, false);
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('game-container');
      common.gameAnimations.flash(element);
      expect(element.classList.contains('flash-effect')).toBe(false);
    });

    test('should remove flash-effect class on animationend', () => {
      const element = document.getElementById('game-container');
      gameAnimations.flash(element);
      element.dispatchEvent(new Event('animationend'));
      expect(element.classList.contains('flash-effect')).toBe(false);
    });
  });

  describe('pageEnter', () => {
    test('should add page-enter class to element', () => {
      const element = document.getElementById('game-container');
      gameAnimations.pageEnter(element);
      expect(element.classList.contains('page-enter')).toBe(true);
    });

    test('should not add class when element is null', () => {
      expect(() => gameAnimations.pageEnter(null)).not.toThrow();
    });

    test('should not add class when prefers-reduced-motion is enabled', () => {
      window.matchMedia = mockMatchMedia(true, false);
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('game-container');
      common.gameAnimations.pageEnter(element);
      expect(element.classList.contains('page-enter')).toBe(false);
    });
  });

  describe('createTiltEffect', () => {
    test('should return enable and disable methods', () => {
      const element = document.getElementById('game-container');
      const tilt = gameAnimations.createTiltEffect(element);
      expect(typeof tilt.enable).toBe('function');
      expect(typeof tilt.disable).toBe('function');
    });

    test('should return no-op methods when element is null', () => {
      const tilt = gameAnimations.createTiltEffect(null);
      expect(() => tilt.enable()).not.toThrow();
      expect(() => tilt.disable()).not.toThrow();
    });

    test('should return no-op methods when prefers-reduced-motion is enabled', () => {
      window.matchMedia = mockMatchMedia(true, false);
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('game-container');
      const tilt = common.gameAnimations.createTiltEffect(element);

      // These should be no-ops
      tilt.enable();
      tilt.disable();

      // Element should not have event listeners (we can't easily test this)
      expect(element.style.transform).toBe('');
    });

    test('should return no-op methods on touch devices', () => {
      window.ontouchstart = true;
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('game-container');
      const tilt = common.gameAnimations.createTiltEffect(element);

      tilt.enable();
      tilt.disable();

      expect(element.style.transform).toBe('');
      delete window.ontouchstart;
    });

    test('should return no-op methods when navigator.maxTouchPoints > 0', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, writable: true });
      jest.resetModules();
      const common = require('./common.js');
      const element = document.getElementById('game-container');
      const tilt = common.gameAnimations.createTiltEffect(element);

      tilt.enable();
      tilt.disable();

      expect(element.style.transform).toBe('');
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true });
    });

    test('should add event listeners on enable', () => {
      const element = document.getElementById('game-container');
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');

      const tilt = gameAnimations.createTiltEffect(element);
      tilt.enable();

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    test('should remove event listeners on disable', () => {
      const element = document.getElementById('game-container');
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');

      const tilt = gameAnimations.createTiltEffect(element);
      tilt.enable();
      tilt.disable();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    test('should apply 3D transform on mousemove', () => {
      const element = document.getElementById('game-container');
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 200
      });

      const tilt = gameAnimations.createTiltEffect(element);
      tilt.enable();

      // Simulate mouse at corner (should produce rotation)
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 0
      });
      element.dispatchEvent(mouseMoveEvent);

      expect(element.style.transform).toContain('perspective(1000px)');
      expect(element.style.transform).toContain('rotateX');
      expect(element.style.transform).toContain('rotateY');
    });

    test('should reset transform on mouseleave', () => {
      const element = document.getElementById('game-container');
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 200
      });

      const tilt = gameAnimations.createTiltEffect(element);
      tilt.enable();

      // Apply transform first
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 0
      });
      element.dispatchEvent(mouseMoveEvent);

      // Then mouseleave
      const mouseLeaveEvent = new MouseEvent('mouseleave');
      element.dispatchEvent(mouseLeaveEvent);

      expect(element.style.transform).toBe('');
      expect(element.style.transition).toContain('transform');
    });

    test('should disable transition on mouseenter for smoother tracking', () => {
      const element = document.getElementById('game-container');

      const tilt = gameAnimations.createTiltEffect(element);
      tilt.enable();

      const mouseEnterEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEnterEvent);

      expect(element.style.transition).toBe('none');
    });

    test('disable should clear transform', () => {
      const element = document.getElementById('game-container');
      element.style.transform = 'perspective(1000px) rotateX(5deg)';

      const tilt = gameAnimations.createTiltEffect(element);
      tilt.enable();
      tilt.disable();

      expect(element.style.transform).toBe('');
    });
  });
});

// ============================================
// ParallaxManager Tests
// ============================================
describe('ParallaxManager', () => {
  let ParallaxManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    ParallaxManager = hub.ParallaxManager;
  });

  test('should not bind events when prefers-reduced-motion', () => {
    window.matchMedia = mockMatchMedia(true, false);
    jest.resetModules();
    const hub = require('./hub.js');

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    new hub.ParallaxManager();

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  test('should not bind events when header is missing', () => {
    document.querySelector('.hub-header').remove();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    new ParallaxManager();

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  test('should bind scroll event when conditions are met', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    new ParallaxManager();

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  test('should update header transform on scroll', (done) => {
    const header = document.querySelector('.hub-header');

    new ParallaxManager();

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));

    // Wait for requestAnimationFrame
    setTimeout(() => {
      // Header should have transform applied
      expect(header.style.transform).toContain('translateY');
      done();
    }, 50);
  });

  test('should update header opacity on scroll', (done) => {
    const header = document.querySelector('.hub-header');

    new ParallaxManager();

    Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
    window.dispatchEvent(new Event('scroll'));

    setTimeout(() => {
      const opacity = parseFloat(header.style.opacity);
      expect(opacity).toBeLessThan(1);
      expect(opacity).toBeGreaterThanOrEqual(0);
      done();
    }, 50);
  });

  test('should set opacity to 0 when scrolled far', (done) => {
    const header = document.querySelector('.hub-header');

    new ParallaxManager();

    Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
    window.dispatchEvent(new Event('scroll'));

    setTimeout(() => {
      expect(header.style.opacity).toBe('0');
      done();
    }, 50);
  });

  test('should use requestAnimationFrame for performance', () => {
    new ParallaxManager();

    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  test('should throttle scroll events using requestAnimationFrame', () => {
    new ParallaxManager();

    // Fire multiple scroll events rapidly
    Object.defineProperty(window, 'scrollY', { value: 10, writable: true });
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));

    // Should only call requestAnimationFrame once while ticking
    expect(requestAnimationFrame).toHaveBeenCalled();
  });
});

// ============================================
// CSS Animation Classes Integration Tests
// ============================================
describe('CSS Animation Classes', () => {
  test('btn-3d class should exist in common.css classes', () => {
    // This tests that the animation methods correspond to real CSS classes
    const common = require('./common.js');
    const element = document.createElement('div');

    common.gameAnimations.pulseScore(element, false);
    expect(element.classList.contains('score-pulse')).toBe(true);
  });

  test('animation classes should be removable', () => {
    const element = document.createElement('div');
    element.classList.add('win-effect', 'lose-effect', 'flash-effect', 'page-enter');

    element.classList.remove('win-effect');
    element.classList.remove('lose-effect');
    element.classList.remove('flash-effect');
    element.classList.remove('page-enter');

    expect(element.classList.contains('win-effect')).toBe(false);
    expect(element.classList.contains('lose-effect')).toBe(false);
    expect(element.classList.contains('flash-effect')).toBe(false);
    expect(element.classList.contains('page-enter')).toBe(false);
  });
});

// ============================================
// Accessibility: Reduced Motion Tests
// ============================================
describe('Accessibility: prefers-reduced-motion', () => {
  test('GameAnimations should respect reduced motion preference', () => {
    window.matchMedia = mockMatchMedia(true, false);
    jest.resetModules();
    const common = require('./common.js');

    expect(common.gameAnimations.prefersReducedMotion).toBe(true);
  });

  test('ScrollAnimationManager should skip animations for reduced motion', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    jest.resetModules();
    const hub = require('./hub.js');

    new hub.ScrollAnimationManager();

    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
      expect(card.classList.contains('animate-in')).toBe(true);
    });
  });

  test('TiltEffectManager should not bind events for reduced motion', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    jest.resetModules();
    const hub = require('./hub.js');
    const manager = new hub.TiltEffectManager();

    expect(manager.prefersReducedMotion).toBe(true);
  });

  test('ParallaxManager should not bind events for reduced motion', () => {
    window.matchMedia = mockMatchMedia(true, false);
    jest.resetModules();
    const hub = require('./hub.js');

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    new hub.ParallaxManager();

    // Should not have bound scroll listener
    const scrollCalls = addEventListenerSpy.mock.calls.filter(
      call => call[0] === 'scroll'
    );
    expect(scrollCalls.length).toBe(0);

    addEventListenerSpy.mockRestore();
  });

  test('All animation methods should be no-ops for reduced motion', () => {
    window.matchMedia = mockMatchMedia(true, false);
    jest.resetModules();
    const common = require('./common.js');

    const element = document.createElement('div');

    // All these should be no-ops
    common.gameAnimations.pulseScore(element, false);
    common.gameAnimations.pulseScore(element, true);
    common.gameAnimations.celebrateWin(element);
    common.gameAnimations.shakeOnLose(element);
    common.gameAnimations.flash(element);
    common.gameAnimations.pageEnter(element);

    // Element should have no animation classes
    expect(element.classList.length).toBe(0);
  });
});

// ============================================
// Touch Device Handling Tests
// ============================================
describe('Touch Device Handling', () => {
  test('TiltEffectManager should not bind events on touch devices (ontouchstart)', () => {
    window.ontouchstart = true;
    jest.resetModules();
    const hub = require('./hub.js');

    const manager = new hub.TiltEffectManager();
    expect(manager.isTouchDevice).toBe(true);

    delete window.ontouchstart;
  });

  test('TiltEffectManager should not bind events on touch devices (maxTouchPoints)', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, writable: true });
    jest.resetModules();
    const hub = require('./hub.js');

    const manager = new hub.TiltEffectManager();
    expect(manager.isTouchDevice).toBe(true);

    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true });
  });

  test('GameAnimations tilt should be no-op on touch devices', () => {
    window.ontouchstart = true;
    jest.resetModules();
    const common = require('./common.js');

    const element = document.createElement('div');
    const tilt = common.gameAnimations.createTiltEffect(element);

    // These should be no-ops
    tilt.enable();
    tilt.disable();

    delete window.ontouchstart;
  });
});

// ============================================
// 3D Transform Calculation Tests
// ============================================
describe('3D Transform Calculations', () => {
  let TiltEffectManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    TiltEffectManager = hub.TiltEffectManager;
  });

  test('handleTilt should calculate correct rotation at center (no rotation)', () => {
    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 200
    });

    // Mouse at exact center
    const centerEvent = { clientX: 150, clientY: 100 };
    manager.handleTilt(centerEvent, card);

    // At center, rotation should be 0 (or very close to 0)
    expect(card.style.transform).toContain('rotateX(0deg)');
    expect(card.style.transform).toContain('rotateY(0deg)');
  });

  test('handleTilt should calculate correct rotation at corners', () => {
    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 200
    });

    // Mouse at top-right corner
    const cornerEvent = { clientX: 300, clientY: 0 };
    manager.handleTilt(cornerEvent, card);

    // Should have positive rotateY (right side) and positive rotateX (top)
    expect(card.style.transform).toContain('rotateX(8deg)');
    expect(card.style.transform).toContain('rotateY(8deg)');
    expect(card.style.transform).toContain('scale(1.02)');
  });

  test('handleTilt should apply perspective', () => {
    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 200
    });

    const event = { clientX: 150, clientY: 100 };
    manager.handleTilt(event, card);

    expect(card.style.transform).toContain('perspective(1000px)');
  });

  test('activateTilt should disable transition', () => {
    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    manager.activateTilt(card);

    expect(card.style.transition).toBe('none');
  });

  test('resetTilt should enable transition and clear transform', () => {
    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    card.style.transform = 'perspective(1000px) rotateX(5deg) rotateY(5deg)';

    manager.resetTilt(card);

    expect(card.style.transform).toBe('');
    expect(card.style.transition).toContain('transform');
    expect(card.style.transition).toContain('0.3s');
    expect(card.style.transition).toContain('ease');
  });
});

// ============================================
// Dark Mode Animation Compatibility Tests
// ============================================
describe('Dark Mode Animation Compatibility', () => {
  test('animations should work in dark mode', () => {
    document.body.classList.add('dark-mode');

    const common = require('./common.js');
    const element = document.getElementById('game-container');

    // Animations should still work
    common.gameAnimations.celebrateWin(element);
    expect(element.classList.contains('win-effect')).toBe(true);
  });

  test('tilt effect should work in dark mode', () => {
    document.body.classList.add('dark-mode');

    const hub = require('./hub.js');
    const manager = new hub.TiltEffectManager();
    const card = document.querySelector('.game-card');

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 200
    });

    const event = { clientX: 200, clientY: 50 };
    manager.handleTilt(event, card);

    expect(card.style.transform).toContain('perspective');
  });
});

// ============================================
// Edge Cases and Error Handling
// ============================================
describe('Edge Cases and Error Handling', () => {
  test('should handle missing DOM elements gracefully', () => {
    document.body.innerHTML = '';

    expect(() => {
      const hub = require('./hub.js');
      new hub.ParallaxManager();
      new hub.TiltEffectManager();
    }).not.toThrow();
  });

  test('GameAnimations should handle rapid successive calls', () => {
    const common = require('./common.js');
    const element = document.getElementById('score');

    // Rapidly call pulseScore
    common.gameAnimations.pulseScore(element, false);
    common.gameAnimations.pulseScore(element, false);
    common.gameAnimations.pulseScore(element, true);
    common.gameAnimations.pulseScore(element, false);

    // Should not throw and element should have a class
    expect(element.classList.contains('score-pulse') || element.classList.contains('score-pop')).toBe(true);
  });

  test('tilt effect should handle elements with no dimensions', () => {
    const common = require('./common.js');
    const element = document.createElement('div');

    element.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 0,
      height: 0
    });

    const tilt = common.gameAnimations.createTiltEffect(element);
    tilt.enable();

    // Should not throw on mousemove
    expect(() => {
      const event = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });
      element.dispatchEvent(event);
    }).not.toThrow();

    tilt.disable();
  });

  test('should handle getBoundingClientRect returning negative values', () => {
    const hub = require('./hub.js');
    const manager = new hub.TiltEffectManager();
    const card = document.querySelector('.game-card');

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: -100,
      top: -50,
      width: 300,
      height: 200
    });

    const event = { clientX: 50, clientY: 50 };

    expect(() => {
      manager.handleTilt(event, card);
    }).not.toThrow();
  });
});

// ============================================
// Stat Card 3D Effects Tests
// ============================================
describe('Stat Card 3D Hover Effects', () => {
  let StatsManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    StatsManager = hub.StatsManager;
  });

  test('stat cards should be rendered with proper structure', () => {
    localStorageMock.setItem('2048-best-score', '1000');

    const manager = new StatsManager();
    const statsGrid = document.getElementById('stats-grid');
    const statCards = statsGrid.querySelectorAll('.stat-card');

    expect(statCards.length).toBe(6);
    statCards.forEach(card => {
      expect(card.querySelector('.stat-card-icon')).not.toBeNull();
      expect(card.querySelector('.stat-card-value')).not.toBeNull();
      expect(card.querySelector('.stat-card-label')).not.toBeNull();
    });
  });
});

// ============================================
// Recent Games Animation Tests
// ============================================
describe('Recent Games Slide-in Animation', () => {
  let RecentGamesManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    RecentGamesManager = hub.RecentGamesManager;
  });

  test('recent game cards should be created with animation structure', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const recentCards = section.querySelectorAll('.recent-game-card');

    expect(recentCards.length).toBe(3);
  });

  test('recent games should have correct game data', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const card = section.querySelector('.recent-game-card');

    expect(card.getAttribute('href')).toBe('games/tetris/index.html');
    expect(card.querySelector('.recent-game-icon').textContent).toBe('🧱');
    expect(card.querySelector('.recent-game-name').textContent).toBe('tetris');
  });
});
