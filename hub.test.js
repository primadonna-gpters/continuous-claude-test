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

  test('should limit to 3 recent games', () => {
    localStorageMock.setItem('recent-games', JSON.stringify(['2048', 'snake', 'tetris', 'breakout', 'memory']));

    const manager = new RecentGamesManager();
    const section = document.getElementById('recent-section');

    expect(section.querySelectorAll('.recent-game-card').length).toBe(3);
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

    expect(name.textContent).toBe('tetris');
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
// Integration Tests
// ============================================
describe('Integration Tests', () => {
  test('DOMContentLoaded should initialize all managers', (done) => {
    // Reset document
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
});
