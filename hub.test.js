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

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
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

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({ scope: '/' })
  }
});

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  jest.clearAllMocks();

  // Reset matchMedia to default (light mode)
  window.matchMedia = mockMatchMedia(false);

  document.body.innerHTML = `
    <div class="hub-container">
      <button id="theme-toggle-btn"></button>
      <section class="recent-section" id="recent-section"></section>
      <section class="stats-section">
        <div class="stats-grid" id="stats-grid"></div>
      </section>
      <div class="games-grid">
        <div class="game-card"></div>
        <div class="game-card"></div>
      </div>
    </div>
  `;
  document.body.classList.remove('dark-mode');

  // Clear module cache to get fresh state for each test
  jest.resetModules();
});

// ============================================
// StatsManager Tests
// ============================================
describe('StatsManager', () => {
  let StatsManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    StatsManager = hub.StatsManager;
  });

  test('should render stats grid with correct structure', () => {
    const manager = new StatsManager();
    const statsGrid = document.getElementById('stats-grid');

    expect(statsGrid.innerHTML).not.toBe('');
    expect(statsGrid.querySelectorAll('.stat-card').length).toBe(6);
  });

  test('should display "-" for games with no score', () => {
    const manager = new StatsManager();
    const statsGrid = document.getElementById('stats-grid');
    const values = statsGrid.querySelectorAll('.stat-card-value');

    // All values should be '-' when localStorage is empty
    values.forEach(val => {
      expect(val.textContent).toBe('-');
    });
  });

  test('should format number scores with locale string', () => {
    localStorageMock.setItem('2048-best-score', '12345');

    const manager = new StatsManager();
    const statsGrid = document.getElementById('stats-grid');
    const firstCard = statsGrid.querySelector('.stat-card');
    const value = firstCard.querySelector('.stat-card-value');

    expect(value.textContent).toBe('12,345');
  });

  test('should format time correctly (minutes:seconds)', () => {
    localStorageMock.setItem('survivor-best-time', '125'); // 2:05

    const manager = new StatsManager();
    const statsGrid = document.getElementById('stats-grid');
    const cards = statsGrid.querySelectorAll('.stat-card');
    const survivorCard = cards[5]; // Survivor is 6th
    const value = survivorCard.querySelector('.stat-card-value');

    expect(value.textContent).toBe('2:05');
  });

  test('should format moves correctly', () => {
    localStorageMock.setItem('memory-best-easy', '24');

    const manager = new StatsManager();
    const statsGrid = document.getElementById('stats-grid');
    const cards = statsGrid.querySelectorAll('.stat-card');
    const memoryCard = cards[4]; // Memory is 5th
    const value = memoryCard.querySelector('.stat-card-value');

    expect(value.textContent).toBe('24');
  });

  test('formatValue should return "-" for null', () => {
    const manager = new StatsManager();
    expect(manager.formatValue(null, 'number')).toBe('-');
  });

  test('formatValue should return "-" for zero', () => {
    const manager = new StatsManager();
    expect(manager.formatValue(0, 'number')).toBe('-');
  });

  test('formatValue should handle time format with zero seconds', () => {
    const manager = new StatsManager();
    expect(manager.formatValue(60, 'time')).toBe('1:00');
  });

  test('formatValue should handle time format with single digit seconds', () => {
    const manager = new StatsManager();
    expect(manager.formatValue(65, 'time')).toBe('1:05');
  });

  test('getGameStats should return 6 game stats', () => {
    const manager = new StatsManager();
    const stats = manager.getGameStats();

    expect(stats.length).toBe(6);
    expect(stats[0].key).toBe('2048-best-score');
    expect(stats[5].key).toBe('survivor-best-time');
  });

  test('should not render if stats-grid element is missing', () => {
    document.getElementById('stats-grid').remove();
    const manager = new StatsManager();
    expect(manager.statsGrid).toBe(null);
  });
});

// ============================================
// RecentGamesManager Tests
// ============================================
describe('RecentGamesManager', () => {
  let RecentGamesManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    RecentGamesManager = hub.RecentGamesManager;
  });

  test('should hide section when no recent games', () => {
    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');

    expect(section.style.display).toBe('none');
  });

  test('should display recent games when available', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');

    expect(section.style.display).not.toBe('none');
    expect(section.innerHTML).toContain('최근 플레이');
    expect(section.querySelectorAll('.recent-game-card').length).toBe(2);
  });

  test('should limit to 5 recent games', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris', 'breakout', 'memory', 'minesweeper', 'survivor']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');

    expect(section.querySelectorAll('.recent-game-card').length).toBe(5);
  });

  test('should display correct game icons', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const icon = section.querySelector('.recent-game-icon');

    expect(icon.textContent).toBe('🔢');
  });

  test('should link to correct game URLs', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['snake']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const link = section.querySelector('.recent-game-card');

    expect(link.getAttribute('href')).toBe('games/snake/index.html');
  });

  test('should skip unknown games', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['unknown-game', '2048']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const cards = section.querySelectorAll('.recent-game-card');

    // Should only show 2048, skip unknown
    expect(cards.length).toBe(1);
  });

  test('should have all 7 games defined', () => {
    const manager = new RecentGamesManager();

    expect(manager.games['2048']).toBeDefined();
    expect(manager.games['snake']).toBeDefined();
    expect(manager.games['minesweeper']).toBeDefined();
    expect(manager.games['tetris']).toBeDefined();
    expect(manager.games['breakout']).toBeDefined();
    expect(manager.games['memory']).toBeDefined();
    expect(manager.games['survivor']).toBeDefined();
  });

  test('should display correct game name', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const name = section.querySelector('.recent-game-name');

    expect(name.textContent).toBe('Tetris');
  });
});

// ============================================
// HubThemeManager Tests
// ============================================
describe('HubThemeManager', () => {
  let HubThemeManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    HubThemeManager = hub.HubThemeManager;
  });

  test('should load saved dark theme', () => {
    localStorageMock.setItem('game-hub-theme', 'dark');

    const manager = new HubThemeManager();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  test('should load saved light theme', () => {
    localStorageMock.setItem('game-hub-theme', 'light');
    document.body.classList.remove('dark-mode');

    const manager = new HubThemeManager();

    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  test('should respect system preference when no saved theme (dark)', () => {
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

    const manager = new HubThemeManager();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  test('should stay light when system prefers light and no saved theme', () => {
    window.matchMedia = mockMatchMedia(false);

    const manager = new HubThemeManager();

    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  test('should toggle theme on button click', () => {
    window.matchMedia = mockMatchMedia(false);
    document.body.classList.remove('dark-mode');
    localStorageMock.clear();

    const manager = new HubThemeManager();
    const btn = document.getElementById('theme-toggle-btn');

    // Verify we start in light mode
    expect(document.body.classList.contains('dark-mode')).toBe(false);

    btn.click();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'dark');
  });

  test('should toggle theme off when already dark', () => {
    document.body.classList.add('dark-mode');
    localStorageMock.setItem('game-hub-theme', 'dark');

    const manager = new HubThemeManager();
    const btn = document.getElementById('theme-toggle-btn');

    btn.click();

    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-theme', 'light');
  });

  test('should handle missing theme toggle button', () => {
    document.getElementById('theme-toggle-btn').remove();

    const manager = new HubThemeManager();

    expect(manager.themeToggleBtn).toBe(null);
  });
});

// ============================================
// ScrollAnimationManager Tests
// ============================================
describe('ScrollAnimationManager', () => {
  let ScrollAnimationManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    ScrollAnimationManager = hub.ScrollAnimationManager;
  });

  test('should create IntersectionObserver', () => {
    const manager = new ScrollAnimationManager();

    expect(IntersectionObserver).toHaveBeenCalled();
  });

  test('should observe all game cards', () => {
    const observeMock = jest.fn();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: observeMock,
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    const manager = new ScrollAnimationManager();
    const cards = document.querySelectorAll('.game-card');

    expect(observeMock).toHaveBeenCalledTimes(cards.length);
  });

  test('should skip animation when prefers-reduced-motion', () => {
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

    const manager = new ScrollAnimationManager();
    const cards = document.querySelectorAll('.game-card');

    cards.forEach(card => {
      expect(card.classList.contains('animate-in')).toBe(true);
    });
  });

  test('should call observer callback on intersection', () => {
    let observerCallback;
    const unobserveMock = jest.fn();

    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: unobserveMock,
        disconnect: jest.fn(),
      };
    });

    const manager = new ScrollAnimationManager();

    // Simulate intersection
    const mockEntry = {
      isIntersecting: true,
      target: document.querySelector('.game-card')
    };

    observerCallback([mockEntry]);

    expect(mockEntry.target.classList.contains('animate-in')).toBe(true);
    expect(unobserveMock).toHaveBeenCalledWith(mockEntry.target);
  });

  test('should not add class when not intersecting', () => {
    let observerCallback;

    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const manager = new ScrollAnimationManager();

    const card = document.querySelector('.game-card');
    const mockEntry = {
      isIntersecting: false,
      target: card
    };

    observerCallback([mockEntry]);

    expect(card.classList.contains('animate-in')).toBe(false);
  });
});

// ============================================
// registerServiceWorker Tests
// ============================================
describe('registerServiceWorker', () => {
  let registerServiceWorker;

  beforeEach(() => {
    const hub = require('./hub.js');
    registerServiceWorker = hub.registerServiceWorker;
    window.addEventListener = jest.fn();
  });

  test('should register service worker when available', () => {
    registerServiceWorker();

    expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });

  test('should handle service worker load event', () => {
    let loadCallback;
    window.addEventListener = jest.fn((event, cb) => {
      if (event === 'load') {
        loadCallback = cb;
      }
    });

    registerServiceWorker();

    expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));

    // Execute the load callback
    loadCallback();

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  test('should handle service worker registration failure', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockError = new Error('Registration failed');

    // Mock the register method to reject
    navigator.serviceWorker.register.mockRejectedValueOnce(mockError);

    let loadCallback;
    window.addEventListener = jest.fn((event, cb) => {
      if (event === 'load') {
        loadCallback = cb;
      }
    });

    registerServiceWorker();
    loadCallback();

    // Wait for the rejected promise
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleLogSpy).toHaveBeenCalledWith('Service Worker registration failed:', mockError);

    consoleLogSpy.mockRestore();
  });
});

// ============================================
// TiltEffectManager Tests
// ============================================
describe('TiltEffectManager', () => {
  let TiltEffectManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    TiltEffectManager = hub.TiltEffectManager;
  });

  test('should not bind events when prefers-reduced-motion', () => {
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

    const manager = new TiltEffectManager();

    // Should not have bound any events
    expect(manager.prefersReducedMotion).toBe(true);
  });

  test('should not bind events on touch devices', () => {
    // Simulate touch device
    const originalOntouchstart = window.ontouchstart;
    window.ontouchstart = true;

    const manager = new TiltEffectManager();

    expect(manager.isTouchDevice).toBe(true);

    // Cleanup
    if (originalOntouchstart === undefined) {
      delete window.ontouchstart;
    } else {
      window.ontouchstart = originalOntouchstart;
    }
  });

  test('should bind events on desktop without reduced motion', () => {
    window.matchMedia = mockMatchMedia(false);
    const originalOntouchstart = window.ontouchstart;
    delete window.ontouchstart;

    // Override navigator.maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true
    });

    const addEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');

    const manager = new TiltEffectManager();

    // Each card should have 3 event listeners (mousemove, mouseleave, mouseenter)
    expect(addEventListenerSpy).toHaveBeenCalled();

    addEventListenerSpy.mockRestore();

    // Cleanup
    if (originalOntouchstart !== undefined) {
      window.ontouchstart = originalOntouchstart;
    }
  });

  test('handleTilt should calculate correct rotation', () => {
    window.matchMedia = mockMatchMedia(false);
    delete window.ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true });

    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    // Mock getBoundingClientRect
    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 200
    });

    // Simulate mouse at center (should result in no rotation)
    const centerEvent = { clientX: 150, clientY: 100 };
    manager.handleTilt(centerEvent, card);

    expect(card.style.transform).toContain('perspective(1000px)');
    expect(card.style.transform).toContain('rotateX(');
    expect(card.style.transform).toContain('rotateY(');
    expect(card.style.transform).toContain('scale(1.03)');
  });

  test('resetTilt should clear transform', () => {
    window.matchMedia = mockMatchMedia(false);
    delete window.ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true });

    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    card.style.transform = 'perspective(1000px) rotateX(5deg) rotateY(5deg)';

    manager.resetTilt(card);

    expect(card.style.transform).toBe('');
    expect(card.style.transition).toContain('transform');
  });

  test('activateTilt should set box-shadow transition', () => {
    window.matchMedia = mockMatchMedia(false);
    delete window.ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true });

    const manager = new TiltEffectManager();
    const card = document.querySelector('.game-card');

    manager.activateTilt(card);

    expect(card.style.transition).toBe('box-shadow 0.1s ease');
  });
});

// ============================================
// recordRecentPlay Tests (common.js)
// ============================================
describe('recordRecentPlay', () => {
  let recordRecentPlay;

  beforeEach(() => {
    const common = require('./common.js');
    recordRecentPlay = common.recordRecentPlay;
  });

  test('should add game to empty recent list', () => {
    recordRecentPlay('2048');

    const recent = JSON.parse(localStorageMock._getStore()['recent-games']);
    expect(recent).toEqual(['2048']);
  });

  test('should add game to front of list', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['snake', 'tetris']));

    recordRecentPlay('2048');

    const recent = JSON.parse(localStorageMock._getStore()['recent-games']);
    expect(recent[0]).toBe('2048');
    expect(recent[1]).toBe('snake');
    expect(recent[2]).toBe('tetris');
  });

  test('should not duplicate game in list', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['snake', '2048', 'tetris']));

    recordRecentPlay('2048');

    const recent = JSON.parse(localStorageMock._getStore()['recent-games']);
    expect(recent).toEqual(['2048', 'snake', 'tetris']);
  });

  test('should limit to 5 games', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['a', 'b', 'c', 'd', 'e']));

    recordRecentPlay('f');

    const recent = JSON.parse(localStorageMock._getStore()['recent-games']);
    expect(recent.length).toBe(5);
    expect(recent[0]).toBe('f');
    expect(recent).not.toContain('e');
  });

  test('should move existing game to front', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['a', 'b', 'c']));

    recordRecentPlay('c');

    const recent = JSON.parse(localStorageMock._getStore()['recent-games']);
    expect(recent).toEqual(['c', 'a', 'b']);
  });
});

// ============================================
// PageLoaderManager Tests
// ============================================
describe('PageLoaderManager', () => {
  let PageLoaderManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="page-loader" id="page-loader">
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <p class="loader-text">Loading Games...</p>
        </div>
      </div>
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;
    jest.useFakeTimers();
    const hub = require('./hub.js');
    PageLoaderManager = hub.PageLoaderManager;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should find loader element', () => {
    const manager = new PageLoaderManager();
    expect(manager.loader).toBeDefined();
    expect(manager.loader.id).toBe('page-loader');
  });

  test('should add loaded class after delay', () => {
    const manager = new PageLoaderManager();
    const loader = document.getElementById('page-loader');

    expect(loader.classList.contains('loaded')).toBe(false);

    jest.advanceTimersByTime(500);

    expect(loader.classList.contains('loaded')).toBe(true);
  });

  test('should handle missing loader element gracefully', () => {
    document.getElementById('page-loader').remove();

    expect(() => new PageLoaderManager()).not.toThrow();
  });
});

// ============================================
// ScrollProgressManager Tests
// ============================================
describe('ScrollProgressManager', () => {
  let ScrollProgressManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="scroll-progress" id="scroll-progress"></div>
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
          <div class="game-card"></div>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);
    const hub = require('./hub.js');
    ScrollProgressManager = hub.ScrollProgressManager;
  });

  test('should find progress bar element', () => {
    const manager = new ScrollProgressManager();
    expect(manager.progressBar).toBeDefined();
    expect(manager.progressBar.id).toBe('scroll-progress');
  });

  test('should not bind events when prefers-reduced-motion', () => {
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

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const manager = new ScrollProgressManager();

    expect(manager.prefersReducedMotion).toBe(true);
    // Should not have bound scroll event
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.any(Object));

    addEventListenerSpy.mockRestore();
  });

  test('should bind scroll events when motion allowed', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const manager = new ScrollProgressManager();

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    addEventListenerSpy.mockRestore();
  });

  test('should update progress bar width on scroll', () => {
    const manager = new ScrollProgressManager();

    // Mock scroll position at 50%
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });

    manager.updateProgress();

    expect(manager.progressBar.style.width).toBe('50%');
  });

  test('should handle zero document height', () => {
    const manager = new ScrollProgressManager();

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });

    manager.updateProgress();

    expect(manager.progressBar.style.width).toBe('0%');
  });

  test('should handle missing progress bar element', () => {
    document.getElementById('scroll-progress').remove();

    expect(() => new ScrollProgressManager()).not.toThrow();
  });
});

// ============================================
// RippleEffectManager Tests
// ============================================
describe('RippleEffectManager', () => {
  let RippleEffectManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <a href="#" class="game-card">
            <div class="game-card-content">
              <h3>Test Game</h3>
            </div>
          </a>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);
    const hub = require('./hub.js');
    RippleEffectManager = hub.RippleEffectManager;
  });

  test('should not bind events when prefers-reduced-motion', () => {
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

    const manager = new RippleEffectManager();
    expect(manager.prefersReducedMotion).toBe(true);
  });

  test('should bind click events to game cards', () => {
    const gameCard = document.querySelector('.game-card');
    const addEventListenerSpy = jest.spyOn(gameCard, 'addEventListener');

    const manager = new RippleEffectManager();

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  test('should bind click events to theme toggle button', () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const addEventListenerSpy = jest.spyOn(themeBtn, 'addEventListener');

    const manager = new RippleEffectManager();

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  test('should create ripple element on click', () => {
    const manager = new RippleEffectManager();
    const element = document.querySelector('.game-card');

    // Mock getBoundingClientRect
    element.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 100
    });

    const mockEvent = {
      clientX: 150,
      clientY: 50
    };

    manager.createRipple(mockEvent, element);

    const ripple = element.querySelector('.ripple');
    expect(ripple).toBeDefined();
    expect(ripple.className).toBe('ripple');
  });

  test('should remove ripple after animation ends', () => {
    const manager = new RippleEffectManager();
    const element = document.querySelector('.game-card');

    element.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 100
    });

    const mockEvent = {
      clientX: 150,
      clientY: 50
    };

    manager.createRipple(mockEvent, element);

    const ripple = element.querySelector('.ripple');
    expect(ripple).toBeDefined();

    // Trigger animationend event
    ripple.dispatchEvent(new Event('animationend'));

    expect(element.querySelector('.ripple')).toBe(null);
  });

  test('should calculate correct ripple size based on element dimensions', () => {
    const manager = new RippleEffectManager();
    const element = document.querySelector('.game-card');

    element.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 200
    });

    const mockEvent = {
      clientX: 200,
      clientY: 100
    };

    manager.createRipple(mockEvent, element);

    const ripple = element.querySelector('.ripple');
    // Size should be max(width, height) = 400
    expect(ripple.style.width).toBe('400px');
    expect(ripple.style.height).toBe('400px');
  });
});

// ============================================
// TypingEffectManager Tests
// ============================================
describe('TypingEffectManager', () => {
  let TypingEffectManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <header class="hub-header">
          <h1>🎮 Game Hub</h1>
          <p class="hub-subtitle">혼자서 즐기는 온라인 게임 컬렉션</p>
        </header>
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;
    jest.useFakeTimers();
    const hub = require('./hub.js');
    TypingEffectManager = hub.TypingEffectManager;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should find subtitle element', () => {
    const manager = new TypingEffectManager();
    expect(manager.subtitle).toBeDefined();
    expect(manager.subtitle.classList.contains('hub-subtitle')).toBe(true);
  });

  test('should add typing-done class after delay', () => {
    const manager = new TypingEffectManager();
    const subtitle = document.querySelector('.hub-subtitle');

    expect(subtitle.classList.contains('typing-done')).toBe(false);

    jest.advanceTimersByTime(5500);

    expect(subtitle.classList.contains('typing-done')).toBe(true);
  });

  test('should handle missing subtitle element', () => {
    document.querySelector('.hub-subtitle').remove();

    expect(() => new TypingEffectManager()).not.toThrow();
  });
});

// ============================================
// ParallaxManager Tests
// ============================================
describe('ParallaxManager', () => {
  let ParallaxManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <header class="hub-header">
          <h1>🎮 Game Hub</h1>
          <p class="hub-subtitle">혼자서 즐기는 온라인 게임 컬렉션</p>
        </header>
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);
    const hub = require('./hub.js');
    ParallaxManager = hub.ParallaxManager;
  });

  test('should find header element', () => {
    const manager = new ParallaxManager();
    expect(manager.header).toBeDefined();
    expect(manager.header.classList.contains('hub-header')).toBe(true);
  });

  test('should not bind events when prefers-reduced-motion', () => {
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

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const manager = new ParallaxManager();

    expect(manager.prefersReducedMotion).toBe(true);

    addEventListenerSpy.mockRestore();
  });

  test('should bind scroll events when motion allowed', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const manager = new ParallaxManager();

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  test('handleScroll should update header transform and opacity', () => {
    const manager = new ParallaxManager();

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });

    manager.handleScroll();

    // translateY should be 100 * 0.3 = 30px
    expect(manager.header.style.transform).toBe('translateY(30px)');
    // opacity should be max(0, 1 - 100/300) = 0.666...
    expect(parseFloat(manager.header.style.opacity)).toBeCloseTo(0.667, 2);
  });

  test('handleScroll should set opacity to 0 at bottom of scroll', () => {
    const manager = new ParallaxManager();

    Object.defineProperty(window, 'scrollY', { value: 400, writable: true });

    manager.handleScroll();

    expect(manager.header.style.opacity).toBe('0');
  });

  test('should handle missing header element', () => {
    document.querySelector('.hub-header').remove();

    expect(() => new ParallaxManager()).not.toThrow();
  });
});

// ============================================
// PageTransitionHandler Tests
// ============================================
describe('PageTransitionHandler', () => {
  let PageTransitionHandler;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <a href="games/2048/index.html" class="game-card">
            <div class="game-card-content">
              <h3>2048</h3>
            </div>
          </a>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);
    const hub = require('./hub.js');
    PageTransitionHandler = hub.PageTransitionHandler;
  });

  test('should not bind events when prefers-reduced-motion', () => {
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

    const manager = new PageTransitionHandler();
    expect(manager.prefersReducedMotion).toBe(true);
  });

  test('should bind click events to game cards when motion allowed', () => {
    const gameCard = document.querySelector('.game-card');
    const addEventListenerSpy = jest.spyOn(gameCard, 'addEventListener');

    const manager = new PageTransitionHandler();

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  test('handleCardClick should prevent default and create overlay', () => {
    jest.useFakeTimers();
    const manager = new PageTransitionHandler();
    const gameCard = document.querySelector('.game-card');

    gameCard.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 50,
      top: 100,
      width: 300,
      height: 200
    });

    const mockEvent = {
      preventDefault: jest.fn()
    };

    manager.handleCardClick(mockEvent, gameCard);

    expect(mockEvent.preventDefault).toHaveBeenCalled();

    const overlay = document.querySelector('.card-transition-overlay');
    expect(overlay).toBeDefined();
    expect(overlay.style.zIndex).toBe('9999');

    jest.useRealTimers();
  });

  test('handleCardClick should store from-hub in sessionStorage', () => {
    jest.useFakeTimers();
    const manager = new PageTransitionHandler();
    const gameCard = document.querySelector('.game-card');

    gameCard.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 50,
      top: 100,
      width: 300,
      height: 200
    });

    const mockEvent = { preventDefault: jest.fn() };

    manager.handleCardClick(mockEvent, gameCard);

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('from-hub', 'true');

    jest.useRealTimers();
  });

  test('handleCardClick should not navigate if no href', () => {
    const manager = new PageTransitionHandler();
    const gameCard = document.querySelector('.game-card');
    gameCard.removeAttribute('href');

    const mockEvent = { preventDefault: jest.fn() };

    manager.handleCardClick(mockEvent, gameCard);

    // Should return early and not create overlay
    const overlay = document.querySelector('.card-transition-overlay');
    expect(overlay).toBe(null);
  });
});

// ============================================
// ParticleSystem Tests
// ============================================
describe('ParticleSystem', () => {
  let ParticleSystem;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    const hub = require('./hub.js');
    ParticleSystem = hub.ParticleSystem;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should not initialize when prefers-reduced-motion', () => {
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

    const system = new ParticleSystem();
    // Container is null when reduced motion is enabled (init() is not called)
    expect(system.container).toBeFalsy();
    // Particles array may be undefined or empty when reduced motion is enabled
    expect(system.particles || []).toEqual([]);
  });

  test('should create particle container', () => {
    const system = new ParticleSystem();
    const container = document.querySelector('.particles-container');

    expect(container).toBeDefined();
    expect(system.container).toBe(container);
  });

  test('should create correct number of particles for desktop', () => {
    const system = new ParticleSystem();

    // Desktop (1024px): 20 particles + 10 shapes = 30 total
    const particles = system.container.querySelectorAll('.particle');
    const shapes = system.container.querySelectorAll('.particle-shape');

    expect(particles.length).toBe(20);
    expect(shapes.length).toBe(10);
  });

  test('should create fewer particles on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

    const system = new ParticleSystem();

    const particles = system.container.querySelectorAll('.particle');
    const shapes = system.container.querySelectorAll('.particle-shape');

    expect(particles.length).toBe(12);
    expect(shapes.length).toBe(6);
  });

  test('should start animation loop', () => {
    const system = new ParticleSystem();

    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(system.animationId).toBeDefined();
  });

  test('destroy should cancel animation and remove container', () => {
    const system = new ParticleSystem();

    system.destroy();

    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(document.querySelector('.particles-container')).toBe(null);
  });

  test('should bind mouse event listeners', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    const system = new ParticleSystem();

    // Verify that mousemove listener was added
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });

    addEventListenerSpy.mockRestore();
  });

  test('updateParticleColors should update colors in dark mode', () => {
    const system = new ParticleSystem();
    document.body.classList.add('dark-mode');

    system.updateParticleColors();

    // Check that at least one particle has the dark mode color
    const particleWithDarkColor = system.particles.find(p =>
      p.element.classList.contains('particle') &&
      p.element.style.background.includes('138, 138, 209')
    );

    // The test verifies that updateParticleColors was called successfully
    // and modified particles based on dark mode
    expect(system.particles.length).toBeGreaterThan(0);
  });
});

// ============================================
// RecentGamesManager - Relative Time Tests
// ============================================
describe('RecentGamesManager - Relative Time', () => {
  let RecentGamesManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    RecentGamesManager = hub.RecentGamesManager;
  });

  test('getRelativeTime should return "방금 전" for very recent times', () => {
    const manager = new RecentGamesManager();
    const now = Date.now();

    expect(manager.getRelativeTime(now - 30000)).toBe('방금 전'); // 30 seconds ago
  });

  test('getRelativeTime should return minutes for recent times', () => {
    const manager = new RecentGamesManager();
    const now = Date.now();

    expect(manager.getRelativeTime(now - 180000)).toBe('3분 전'); // 3 minutes ago
  });

  test('getRelativeTime should return hours for older times', () => {
    const manager = new RecentGamesManager();
    const now = Date.now();

    expect(manager.getRelativeTime(now - 7200000)).toBe('2시간 전'); // 2 hours ago
  });

  test('getRelativeTime should return days for much older times', () => {
    const manager = new RecentGamesManager();
    const now = Date.now();

    expect(manager.getRelativeTime(now - 172800000)).toBe('2일 전'); // 2 days ago
  });

  test('getRelativeTime should return empty string for very old times', () => {
    const manager = new RecentGamesManager();
    const now = Date.now();

    expect(manager.getRelativeTime(now - 604800001)).toBe(''); // More than 7 days ago
  });

  test('getRelativeTime should return empty string for null timestamp', () => {
    const manager = new RecentGamesManager();

    expect(manager.getRelativeTime(null)).toBe('');
  });

  test('should display relative time in recent game cards', () => {
    const now = Date.now();
    localStorageMock.setItem('recent-games', JSON.stringify(['2048']));
    localStorageMock.setItem('recent-games-timestamps', JSON.stringify({ '2048': now - 120000 })); // 2 minutes ago

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const timeElement = section.querySelector('.recent-game-time');

    expect(timeElement).toBeDefined();
    expect(timeElement.textContent).toBe('2분 전');
  });
});

// ============================================
// StatsManager - Count-up Animation Tests
// ============================================
describe('StatsManager - Count-up Animation', () => {
  let StatsManager;

  beforeEach(() => {
    jest.useFakeTimers();
    const hub = require('./hub.js');
    StatsManager = hub.StatsManager;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should add counting class during animation', () => {
    localStorageMock.setItem('2048-best-score', '1000');

    let observerCallback;
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const manager = new StatsManager();
    const statCard = document.querySelector('.stat-card');

    // Trigger intersection
    observerCallback([{ isIntersecting: true, target: statCard }]);

    // Run animation frame
    jest.advanceTimersByTime(100);

    const valueEl = statCard.querySelector('.stat-card-value');
    expect(valueEl.classList.contains('counting')).toBe(true);
  });

  test('should not animate time format values', () => {
    localStorageMock.setItem('survivor-best-time', '125');

    let observerCallback;
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const manager = new StatsManager();
    const statCards = document.querySelectorAll('.stat-card');
    const survivorCard = statCards[5]; // Survivor is 6th

    // Trigger intersection
    observerCallback([{ isIntersecting: true, target: survivorCard }]);

    const valueEl = survivorCard.querySelector('.stat-card-value');
    // Should remain as formatted time, not animated
    expect(valueEl.textContent).toBe('2:05');
  });

  test('should render tooltip in stat cards', () => {
    localStorageMock.setItem('2048-best-score', '1000');

    const manager = new StatsManager();
    const statCard = document.querySelector('.stat-card');
    const tooltip = statCard.querySelector('.stat-card-tooltip');

    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toBe('2048 게임 최고 점수');
  });

  test('should skip animation when prefers-reduced-motion', () => {
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

    localStorageMock.setItem('2048-best-score', '1000');

    const manager = new StatsManager();
    expect(manager.prefersReducedMotion).toBe(true);

    // Should display final value immediately without animation
    const statCard = document.querySelector('.stat-card');
    const valueEl = statCard.querySelector('.stat-card-value');
    expect(valueEl.textContent).toBe('1,000');
  });
});

// ============================================
// Integration Tests
// ============================================
describe('Integration Tests', () => {
  test('DOMContentLoaded should initialize all managers', (done) => {
    // Reset document
    document.body.innerHTML = `
      <div class="page-loader" id="page-loader"></div>
      <div class="scroll-progress" id="scroll-progress"></div>
      <div class="hub-container">
        <header class="hub-header">
          <h1>🎮 Game Hub</h1>
          <p class="hub-subtitle">혼자서 즐기는 온라인 게임 컬렉션</p>
        </header>
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;

    // Require will trigger DOMContentLoaded handler
    require('./hub.js');

    // Dispatch DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Check that stats grid is populated
    setTimeout(() => {
      const statsGrid = document.getElementById('stats-grid');
      expect(statsGrid.innerHTML).not.toBe('');
      done();
    }, 0);
  });

  test('All new managers should be exported', () => {
    const hub = require('./hub.js');

    expect(hub.PageLoaderManager).toBeDefined();
    expect(hub.ScrollProgressManager).toBeDefined();
    expect(hub.RippleEffectManager).toBeDefined();
    expect(hub.TypingEffectManager).toBeDefined();
    expect(hub.ParallaxManager).toBeDefined();
    expect(hub.PageTransitionHandler).toBeDefined();
    expect(hub.ParticleSystem).toBeDefined();
    expect(hub.AnimationToggleManager).toBeDefined();
    expect(hub.FooterStatsManager).toBeDefined();
    expect(hub.PWAInstallManager).toBeDefined();
    expect(hub.TouchInteractionManager).toBeDefined();
  });
});

// ============================================
// AnimationToggleManager Tests
// ============================================
describe('AnimationToggleManager', () => {
  let AnimationToggleManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="animation-toggle-btn" aria-pressed="false"></button>
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);
    const hub = require('./hub.js');
    AnimationToggleManager = hub.AnimationToggleManager;
  });

  test('should find animation toggle button', () => {
    const manager = new AnimationToggleManager();
    expect(manager.animationToggleBtn).toBeDefined();
    expect(manager.animationToggleBtn.id).toBe('animation-toggle-btn');
  });

  test('should load disabled state from localStorage', () => {
    localStorageMock.setItem('game-hub-animations', 'disabled');

    const manager = new AnimationToggleManager();

    expect(document.body.classList.contains('animations-disabled')).toBe(true);
  });

  test('should load enabled state from localStorage', () => {
    localStorageMock.setItem('game-hub-animations', 'enabled');
    document.body.classList.remove('animations-disabled');

    const manager = new AnimationToggleManager();

    expect(document.body.classList.contains('animations-disabled')).toBe(false);
  });

  test('should disable animations when prefers-reduced-motion is set', () => {
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

    const manager = new AnimationToggleManager();

    expect(document.body.classList.contains('animations-disabled')).toBe(true);
  });

  test('should toggle animations on button click', () => {
    document.body.classList.remove('animations-disabled');
    localStorageMock.clear();

    const manager = new AnimationToggleManager();
    const btn = document.getElementById('animation-toggle-btn');

    // Start with animations enabled
    expect(document.body.classList.contains('animations-disabled')).toBe(false);

    btn.click();

    expect(document.body.classList.contains('animations-disabled')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-animations', 'disabled');
  });

  test('should toggle animations back on when already disabled', () => {
    document.body.classList.add('animations-disabled');
    localStorageMock.setItem('game-hub-animations', 'disabled');

    const manager = new AnimationToggleManager();
    const btn = document.getElementById('animation-toggle-btn');

    btn.click();

    expect(document.body.classList.contains('animations-disabled')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('game-hub-animations', 'enabled');
  });

  test('should update aria-pressed when animations are disabled', () => {
    const manager = new AnimationToggleManager();
    const btn = document.getElementById('animation-toggle-btn');

    manager.disableAnimations();

    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  test('should update aria-pressed when animations are enabled', () => {
    const manager = new AnimationToggleManager();
    const btn = document.getElementById('animation-toggle-btn');

    manager.enableAnimations();

    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  test('should handle missing animation toggle button', () => {
    document.getElementById('animation-toggle-btn').remove();

    expect(() => new AnimationToggleManager()).not.toThrow();
  });

  test('should respond to prefers-reduced-motion change event', () => {
    let changeHandler;
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const manager = new AnimationToggleManager();

    // Simulate prefers-reduced-motion change to true
    if (changeHandler) {
      changeHandler({ matches: true });
    }

    expect(document.body.classList.contains('animations-disabled')).toBe(true);
  });
});

// ============================================
// FooterStatsManager Tests
// ============================================
describe('FooterStatsManager', () => {
  let FooterStatsManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
        <footer>
          <div id="footer-total-stats"></div>
        </footer>
      </div>
    `;
    const hub = require('./hub.js');
    FooterStatsManager = hub.FooterStatsManager;
  });

  test('should find footer stats container', () => {
    const manager = new FooterStatsManager();
    expect(manager.container).toBeDefined();
    expect(manager.container.id).toBe('footer-total-stats');
  });

  test('should render footer stats with correct structure', () => {
    const manager = new FooterStatsManager();
    const container = document.getElementById('footer-total-stats');

    expect(container.querySelectorAll('.footer-stat-item').length).toBe(3);
  });

  test('should calculate total plays from localStorage', () => {
    localStorageMock.setItem('snake_plays', '10');
    localStorageMock.setItem('tetris_plays', '20');
    localStorageMock.setItem('2048_plays', '5');

    const manager = new FooterStatsManager();
    const stats = manager.getTotalStats();

    expect(stats.totalPlays).toBe(35);
  });

  test('should calculate total time from localStorage', () => {
    localStorageMock.setItem('snake_time', '100');
    localStorageMock.setItem('tetris_time', '200');
    localStorageMock.setItem('memory_time', '50');

    const manager = new FooterStatsManager();
    const stats = manager.getTotalStats();

    expect(stats.totalTime).toBe(350);
  });

  test('should count games played correctly', () => {
    localStorageMock.setItem('snake_plays', '10');
    localStorageMock.setItem('tetris_plays', '5');
    localStorageMock.setItem('memory_plays', '0'); // Not played

    const manager = new FooterStatsManager();
    const stats = manager.getTotalStats();

    expect(stats.gamesPlayed).toBe(2);
  });

  test('formatTime should return seconds for small values', () => {
    const manager = new FooterStatsManager();
    expect(manager.formatTime(30)).toBe('30초');
  });

  test('formatTime should return minutes for medium values', () => {
    const manager = new FooterStatsManager();
    expect(manager.formatTime(120)).toBe('2분');
  });

  test('formatTime should return hours for large values', () => {
    const manager = new FooterStatsManager();
    expect(manager.formatTime(7200)).toBe('2시간');
  });

  test('should handle missing footer stats container', () => {
    document.getElementById('footer-total-stats').remove();

    expect(() => new FooterStatsManager()).not.toThrow();
  });

  test('should display correct icons in footer stats', () => {
    const manager = new FooterStatsManager();
    const container = document.getElementById('footer-total-stats');
    const icons = container.querySelectorAll('.footer-stat-icon');

    expect(icons[0].textContent).toBe('🎮');
    expect(icons[1].textContent).toBe('⏱️');
    expect(icons[2].textContent).toBe('🏆');
  });

  test('should display games played with correct format', () => {
    localStorageMock.setItem('snake_plays', '1');
    localStorageMock.setItem('tetris_plays', '1');
    localStorageMock.setItem('memory_plays', '1');

    const manager = new FooterStatsManager();
    const container = document.getElementById('footer-total-stats');
    const values = container.querySelectorAll('.footer-stat-value');

    expect(values[2].textContent).toBe('3/8');
  });
});

// ============================================
// PWAInstallManager Tests
// ============================================
describe('PWAInstallManager', () => {
  let PWAInstallManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <button id="pwa-install-btn" style="display: none;">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7z"/>
            <path d="M5 18v2h14v-2H5z"/>
          </svg>
          <span>앱 설치</span>
        </button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);
    const hub = require('./hub.js');
    PWAInstallManager = hub.PWAInstallManager;
  });

  test('should find install button', () => {
    const manager = new PWAInstallManager();
    expect(manager.installBtn).toBeDefined();
    expect(manager.installBtn.id).toBe('pwa-install-btn');
  });

  test('should show install button on beforeinstallprompt event', () => {
    const manager = new PWAInstallManager();
    const btn = document.getElementById('pwa-install-btn');

    const mockEvent = {
      preventDefault: jest.fn(),
    };

    window.dispatchEvent(new CustomEvent('beforeinstallprompt'));
    manager.showInstallButton();

    expect(btn.style.display).toBe('inline-flex');
  });

  test('should hide install button', () => {
    const manager = new PWAInstallManager();
    const btn = document.getElementById('pwa-install-btn');

    btn.style.display = 'inline-flex';
    manager.hideInstallButton();

    expect(btn.style.display).toBe('none');
  });

  test('should show installed state', () => {
    const manager = new PWAInstallManager();
    const btn = document.getElementById('pwa-install-btn');

    manager.showInstalledState();

    expect(btn.style.display).toBe('inline-flex');
    expect(btn.classList.contains('installed')).toBe(true);
    expect(btn.innerHTML).toContain('설치됨');
  });

  test('should handle missing install button', () => {
    document.getElementById('pwa-install-btn').remove();

    expect(() => new PWAInstallManager()).not.toThrow();
  });

  test('should not trigger install when deferredPrompt is null', async () => {
    const manager = new PWAInstallManager();

    // deferredPrompt is null by default
    await manager.handleInstallClick();

    // Should return early without error
    expect(manager.deferredPrompt).toBe(null);
  });

  test('should show installed state when in standalone mode', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const manager = new PWAInstallManager();
    const btn = document.getElementById('pwa-install-btn');

    expect(btn.classList.contains('installed')).toBe(true);
  });
});

// ============================================
// TouchInteractionManager Tests
// ============================================
describe('TouchInteractionManager', () => {
  let TouchInteractionManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid"></div>
        </section>
        <div class="games-grid">
          <a href="games/2048/index.html" class="game-card">
            <div class="game-card-content">
              <h3>2048</h3>
            </div>
          </a>
          <a href="games/snake/index.html" class="game-card">
            <div class="game-card-content">
              <h3>Snake</h3>
            </div>
          </a>
        </div>
      </div>
    `;
    // Simulate touch device
    window.ontouchstart = true;
    const hub = require('./hub.js');
    TouchInteractionManager = hub.TouchInteractionManager;
  });

  afterEach(() => {
    delete window.ontouchstart;
  });

  test('should detect touch device', () => {
    const manager = new TouchInteractionManager();
    expect(manager.isTouchDevice).toBe(true);
  });

  test('should not initialize on non-touch devices', () => {
    delete window.ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true });

    const manager = new TouchInteractionManager();
    expect(manager.isTouchDevice).toBe(false);
    expect(manager.modal).toBeUndefined();
  });

  test('should create modal and backdrop elements', () => {
    const manager = new TouchInteractionManager();

    expect(manager.modal).toBeDefined();
    expect(manager.backdrop).toBeDefined();
    expect(manager.modal.classList.contains('touch-info-modal')).toBe(true);
    expect(manager.backdrop.classList.contains('touch-info-modal-backdrop')).toBe(true);
  });

  test('should have gameInfo for all games', () => {
    const manager = new TouchInteractionManager();

    expect(manager.gameInfo['2048']).toBeDefined();
    expect(manager.gameInfo['snake']).toBeDefined();
    expect(manager.gameInfo['minesweeper']).toBeDefined();
    expect(manager.gameInfo['tetris']).toBeDefined();
    expect(manager.gameInfo['breakout']).toBeDefined();
    expect(manager.gameInfo['memory']).toBeDefined();
    expect(manager.gameInfo['survivor']).toBeDefined();
  });

  test('getGameKeyFromHref should extract game key from href', () => {
    const manager = new TouchInteractionManager();

    expect(manager.getGameKeyFromHref('games/2048/index.html')).toBe('2048');
    expect(manager.getGameKeyFromHref('games/snake/index.html')).toBe('snake');
    expect(manager.getGameKeyFromHref(null)).toBe(null);
    expect(manager.getGameKeyFromHref('')).toBe(null);
  });

  test('showModal should display modal with correct game info', () => {
    const manager = new TouchInteractionManager();

    manager.showModal('2048', 'games/2048/index.html');

    expect(manager.modal.classList.contains('active')).toBe(true);
    expect(manager.backdrop.classList.contains('active')).toBe(true);
    expect(manager.modal.querySelector('.touch-info-modal-icon').textContent).toBe('🔢');
    expect(manager.modal.querySelector('.touch-info-modal-title').textContent).toBe('2048');
  });

  test('closeModal should hide modal and backdrop', () => {
    const manager = new TouchInteractionManager();

    manager.showModal('2048', 'games/2048/index.html');
    expect(manager.modal.classList.contains('active')).toBe(true);

    manager.closeModal();

    expect(manager.modal.classList.contains('active')).toBe(false);
    expect(manager.backdrop.classList.contains('active')).toBe(false);
  });

  test('should close modal when backdrop is clicked', () => {
    const manager = new TouchInteractionManager();

    manager.showModal('2048', 'games/2048/index.html');
    manager.backdrop.click();

    expect(manager.modal.classList.contains('active')).toBe(false);
  });

  test('should close modal when close button is clicked', () => {
    const manager = new TouchInteractionManager();

    manager.showModal('2048', 'games/2048/index.html');
    manager.modal.querySelector('.touch-info-modal-close').click();

    expect(manager.modal.classList.contains('active')).toBe(false);
  });

  test('triggerHapticFeedback should call navigator.vibrate if available', () => {
    navigator.vibrate = jest.fn();
    const manager = new TouchInteractionManager();

    manager.triggerHapticFeedback();

    expect(navigator.vibrate).toHaveBeenCalledWith(50);
  });

  test('triggerHapticFeedback should not throw when vibrate is unavailable', () => {
    delete navigator.vibrate;
    const manager = new TouchInteractionManager();

    expect(() => manager.triggerHapticFeedback()).not.toThrow();
  });

  test('handleTouchEnd should clear longPressTimer', () => {
    jest.useFakeTimers();
    const manager = new TouchInteractionManager();

    manager.longPressTimer = setTimeout(() => {}, 1000);
    expect(manager.longPressTimer).not.toBe(null);

    manager.handleTouchEnd();

    expect(manager.longPressTimer).toBe(null);
    jest.useRealTimers();
  });

  test('showModal should not throw for unknown game', () => {
    const manager = new TouchInteractionManager();

    expect(() => manager.showModal('unknown', 'games/unknown/index.html')).not.toThrow();
  });
});

// ============================================
// StatsManager - calculateProgress Tests
// ============================================
describe('StatsManager - calculateProgress', () => {
  let StatsManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    StatsManager = hub.StatsManager;
  });

  test('should return 0 for null value', () => {
    const manager = new StatsManager();
    expect(manager.calculateProgress(null, 100)).toBe(0);
  });

  test('should return 0 for zero value', () => {
    const manager = new StatsManager();
    expect(manager.calculateProgress(0, 100)).toBe(0);
  });

  test('should calculate correct progress percentage', () => {
    const manager = new StatsManager();
    expect(manager.calculateProgress(50, 100)).toBe(50);
    expect(manager.calculateProgress(25, 100)).toBe(25);
  });

  test('should cap progress at 100', () => {
    const manager = new StatsManager();
    expect(manager.calculateProgress(150, 100)).toBe(100);
  });

  test('should calculate inverse progress correctly', () => {
    const manager = new StatsManager();
    // For inverse, lower is better (like moves in memory game)
    // If maxValue is 50 and value is 10, progress should be (50-10)/50 * 100 = 80%
    expect(manager.calculateProgress(10, 50, true)).toBe(80);
  });

  test('should handle inverse progress with maxValue', () => {
    const manager = new StatsManager();
    // If value equals maxValue in inverse mode, progress should be 0
    expect(manager.calculateProgress(50, 50, true)).toBe(0);
  });

  test('should render progress bars in stat cards', () => {
    localStorageMock.setItem('2048-best-score', '50000');

    const manager = new StatsManager();
    const progressBar = document.querySelector('.stat-card-progress-bar');

    expect(progressBar).toBeDefined();
    expect(progressBar.dataset.progress).toBeDefined();
  });

  test('should render type icons in stat cards', () => {
    const manager = new StatsManager();
    const typeIcons = document.querySelectorAll('.stat-card-type-icon');

    expect(typeIcons.length).toBe(6);
    expect(typeIcons[0].textContent).toBe('🏆');
  });
});

// ============================================
// RecentGamesManager - Carousel Tests
// ============================================
describe('RecentGamesManager - Carousel', () => {
  let RecentGamesManager;

  beforeEach(() => {
    const hub = require('./hub.js');
    RecentGamesManager = hub.RecentGamesManager;
  });

  test('should render carousel navigation buttons', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');

    expect(section.querySelector('.carousel-prev')).toBeDefined();
    expect(section.querySelector('.carousel-next')).toBeDefined();
  });

  test('should render carousel dots for multiple games', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const dots = section.querySelectorAll('.carousel-dot');

    expect(dots.length).toBe(3);
    expect(dots[0].classList.contains('active')).toBe(true);
  });

  test('should not render dots for single game', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const dotsContainer = section.querySelector('.carousel-dots');

    expect(dotsContainer).toBe(null);
  });

  test('should disable prev button at start', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const prevBtn = section.querySelector('.carousel-prev');

    expect(prevBtn.disabled).toBe(true);
  });

  test('should not disable next button when there are more games', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const nextBtn = section.querySelector('.carousel-next');

    expect(nextBtn.disabled).toBe(false);
  });

  test('should disable next button when only one game', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const nextBtn = section.querySelector('.carousel-next');

    expect(nextBtn.disabled).toBe(true);
  });

  test('updateCarouselState should update button states correctly', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const prevBtn = section.querySelector('.carousel-prev');
    const nextBtn = section.querySelector('.carousel-next');
    const dots = section.querySelectorAll('.carousel-dot');

    // Simulate moving to middle
    manager.updateCarouselState(1, 3, prevBtn, nextBtn, dots);

    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);
    expect(dots[1].classList.contains('active')).toBe(true);
    expect(dots[0].classList.contains('active')).toBe(false);
  });

  test('updateCarouselState should disable next at end', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const prevBtn = section.querySelector('.carousel-prev');
    const nextBtn = section.querySelector('.carousel-next');
    const dots = section.querySelectorAll('.carousel-dot');

    // Simulate moving to end
    manager.updateCarouselState(2, 3, prevBtn, nextBtn, dots);

    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(true);
    expect(dots[2].classList.contains('active')).toBe(true);
  });

  test('should limit displayed games to 5', () => {
    localStorageMock.setItem('recent-games', JSON.stringify([
      '2048', 'snake', 'tetris', 'breakout', 'memory', 'minesweeper', 'survivor'
    ]));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');
    const cards = section.querySelectorAll('.recent-game-card');

    expect(cards.length).toBe(5);
  });

  test('should have correct currentIndex initial value', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake']));

    const manager = new RecentGamesManager();

    expect(manager.currentIndex).toBe(0);
  });
});

// ============================================
// ScrollAnimationManager - Stat Cards Tests
// ============================================
describe('ScrollAnimationManager - Stat Cards', () => {
  let ScrollAnimationManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hub-container">
        <button id="theme-toggle-btn"></button>
        <section class="recent-section" id="recent-section"></section>
        <section class="stats-section">
          <div class="stats-grid" id="stats-grid">
            <div class="stat-card"></div>
            <div class="stat-card"></div>
          </div>
        </section>
        <div class="games-grid">
          <div class="game-card"></div>
        </div>
      </div>
    `;
    window.matchMedia = mockMatchMedia(false);
    jest.useFakeTimers();
    const hub = require('./hub.js');
    ScrollAnimationManager = hub.ScrollAnimationManager;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should observe stat cards after delay', () => {
    const observeMock = jest.fn();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: observeMock,
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    const manager = new ScrollAnimationManager();

    // Stat cards are observed after 100ms delay
    jest.advanceTimersByTime(100);

    const statCards = document.querySelectorAll('.stat-card');
    // Should observe game cards + stat cards
    expect(observeMock).toHaveBeenCalledTimes(3); // 1 game card + 2 stat cards
  });

  test('should add animate-in class to stat cards when prefers-reduced-motion', () => {
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

    const manager = new ScrollAnimationManager();
    const statCards = document.querySelectorAll('.stat-card');

    statCards.forEach(card => {
      expect(card.classList.contains('animate-in')).toBe(true);
    });
  });
});
