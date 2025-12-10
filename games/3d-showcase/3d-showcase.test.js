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

// Mock recordRecentPlay from common.js
window.recordRecentPlay = jest.fn();

// Set up DOM before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  window.matchMedia = mockMatchMedia(false);

  document.body.innerHTML = `
    <body class="animated-bg">
      <div class="container fade-in">
        <header>
          <div class="header-left">
            <a href="../../index.html" class="back-btn" aria-label="Back to Game Hub">← Hub</a>
            <h1>🎪 3D Showcase</h1>
          </div>
          <div class="header-controls">
            <button id="theme-toggle-btn" aria-label="Toggle dark mode">
              <span class="theme-icon light-icon">🌙</span>
              <span class="theme-icon dark-icon">☀️</span>
            </button>
          </div>
        </header>

        <div class="controls-panel" role="group" aria-label="Animation controls">
          <div class="control-group">
            <label for="speed-select">Speed:</label>
            <select id="speed-select" aria-label="Animation speed">
              <option value="slow">Slow</option>
              <option value="normal" selected>Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          <button id="pause-btn" class="control-btn" aria-label="Pause animations">
            <span class="pause-icon">⏸️</span>
            <span class="play-icon hidden">▶️</span>
            <span class="btn-text">Pause</span>
          </button>
        </div>

        <section class="demo-section" aria-labelledby="cube-title">
          <h2 id="cube-title" class="section-title">3D Rotating Cube</h2>
          <div class="scene-3d cube-scene" aria-hidden="true">
            <div class="cube">
              <div class="cube-face cube-front">Front</div>
              <div class="cube-face cube-back">Back</div>
              <div class="cube-face cube-right">Right</div>
              <div class="cube-face cube-left">Left</div>
              <div class="cube-face cube-top">Top</div>
              <div class="cube-face cube-bottom">Bottom</div>
            </div>
          </div>
        </section>

        <section class="demo-section" aria-labelledby="cards-title">
          <h2 id="cards-title" class="section-title">Floating 3D Cards</h2>
          <div class="cards-container" aria-label="Interactive 3D cards">
            <div class="floating-card" tabindex="0" role="button" aria-label="Card 1">
              <div class="card-inner">
                <div class="card-face-front"><span class="card-icon">🎮</span></div>
                <div class="card-face-back"><span class="card-text">Play!</span></div>
              </div>
            </div>
            <div class="floating-card" tabindex="0" role="button" aria-label="Card 2">
              <div class="card-inner">
                <div class="card-face-front"><span class="card-icon">🎨</span></div>
                <div class="card-face-back"><span class="card-text">Create!</span></div>
              </div>
            </div>
            <div class="floating-card" tabindex="0" role="button" aria-label="Card 3">
              <div class="card-inner">
                <div class="card-face-front"><span class="card-icon">🚀</span></div>
                <div class="card-face-back"><span class="card-text">Fast!</span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="demo-section parallax-section" aria-labelledby="parallax-title">
          <h2 id="parallax-title" class="section-title">3D Parallax Scene</h2>
          <div class="parallax-container" aria-hidden="true">
            <div class="parallax-layer parallax-bg"></div>
            <div class="parallax-layer parallax-mid"></div>
            <div class="parallax-layer parallax-fg"></div>
          </div>
        </section>

        <section class="demo-section" aria-labelledby="sphere-title">
          <h2 id="sphere-title" class="section-title">Interactive Sphere</h2>
          <div class="sphere-container" aria-hidden="true">
            <div class="sphere">
              <div class="sphere-ring ring-1"></div>
              <div class="sphere-ring ring-2"></div>
              <div class="sphere-ring ring-3"></div>
              <div class="sphere-ring ring-4"></div>
              <div class="sphere-core"></div>
            </div>
          </div>
        </section>
      </div>
    </body>
  `;
  document.body.classList.remove('dark-mode', 'animations-paused', 'speed-slow', 'speed-fast');

  jest.resetModules();
});

// ============================================
// Theme Management Tests
// ============================================
describe('Theme Management', () => {
  test('should initialize with light theme by default', () => {
    require('./script.js');

    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  test('should initialize with dark theme when saved in localStorage', () => {
    localStorageMock.setItem('theme', 'dark');

    require('./script.js');

    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  test('should toggle theme on button click', () => {
    require('./script.js');

    const btn = document.getElementById('theme-toggle-btn');
    btn.click();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  test('should toggle theme back to light', () => {
    localStorageMock.setItem('theme', 'dark');

    require('./script.js');

    const btn = document.getElementById('theme-toggle-btn');
    btn.click();

    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });
});

// ============================================
// Animation Speed Control Tests
// ============================================
describe('Animation Speed Control', () => {
  test('should initialize with normal speed by default', () => {
    require('./script.js');

    const select = document.getElementById('speed-select');

    expect(select.value).toBe('normal');
    expect(document.body.classList.contains('speed-slow')).toBe(false);
    expect(document.body.classList.contains('speed-fast')).toBe(false);
  });

  test('should load saved speed from localStorage', () => {
    localStorageMock.setItem('animation-speed', 'slow');

    require('./script.js');

    const select = document.getElementById('speed-select');

    expect(select.value).toBe('slow');
    expect(document.body.classList.contains('speed-slow')).toBe(true);
  });

  test('should apply slow speed class when selected', () => {
    require('./script.js');

    const select = document.getElementById('speed-select');
    select.value = 'slow';
    select.dispatchEvent(new Event('change'));

    expect(document.body.classList.contains('speed-slow')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('animation-speed', 'slow');
  });

  test('should apply fast speed class when selected', () => {
    require('./script.js');

    const select = document.getElementById('speed-select');
    select.value = 'fast';
    select.dispatchEvent(new Event('change'));

    expect(document.body.classList.contains('speed-fast')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('animation-speed', 'fast');
  });

  test('should remove speed classes when normal is selected', () => {
    localStorageMock.setItem('animation-speed', 'fast');

    require('./script.js');

    const select = document.getElementById('speed-select');
    select.value = 'normal';
    select.dispatchEvent(new Event('change'));

    expect(document.body.classList.contains('speed-slow')).toBe(false);
    expect(document.body.classList.contains('speed-fast')).toBe(false);
  });
});

// ============================================
// Pause/Play Control Tests
// ============================================
describe('Pause/Play Control', () => {
  test('should start with animations playing', () => {
    require('./script.js');

    expect(document.body.classList.contains('animations-paused')).toBe(false);
  });

  test('should pause animations on button click', () => {
    require('./script.js');

    const btn = document.getElementById('pause-btn');
    btn.click();

    expect(document.body.classList.contains('animations-paused')).toBe(true);
  });

  test('should resume animations on second click', () => {
    require('./script.js');

    const btn = document.getElementById('pause-btn');
    btn.click();
    btn.click();

    expect(document.body.classList.contains('animations-paused')).toBe(false);
  });

  test('should toggle pause icon visibility', () => {
    require('./script.js');

    const btn = document.getElementById('pause-btn');
    const pauseIcon = btn.querySelector('.pause-icon');
    const playIcon = btn.querySelector('.play-icon');

    btn.click();

    expect(pauseIcon.classList.contains('hidden')).toBe(true);
    expect(playIcon.classList.contains('hidden')).toBe(false);
  });

  test('should update button text when paused', () => {
    require('./script.js');

    const btn = document.getElementById('pause-btn');
    const btnText = btn.querySelector('.btn-text');

    btn.click();

    expect(btnText.textContent).toBe('Play');
  });

  test('should update aria-label when paused', () => {
    require('./script.js');

    const btn = document.getElementById('pause-btn');

    btn.click();

    expect(btn.getAttribute('aria-label')).toBe('Play animations');
  });
});

// ============================================
// Floating Cards Tests
// ============================================
describe('Floating Cards', () => {
  test('should flip card on click', () => {
    require('./script.js');

    const card = document.querySelector('.floating-card');
    card.click();

    expect(card.classList.contains('flipped')).toBe(true);
  });

  test('should unflip card on second click', () => {
    require('./script.js');

    const card = document.querySelector('.floating-card');
    card.click();
    card.click();

    expect(card.classList.contains('flipped')).toBe(false);
  });

  test('should flip card on Enter key', () => {
    require('./script.js');

    const card = document.querySelector('.floating-card');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    card.dispatchEvent(enterEvent);

    expect(card.classList.contains('flipped')).toBe(true);
  });

  test('should flip card on Space key', () => {
    require('./script.js');

    const card = document.querySelector('.floating-card');
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    card.dispatchEvent(spaceEvent);

    expect(card.classList.contains('flipped')).toBe(true);
  });

  test('should apply tilt effect on mousemove', () => {
    require('./script.js');

    const card = document.querySelector('.floating-card');
    const inner = card.querySelector('.card-inner');

    // Mock getBoundingClientRect
    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 140,
      height: 180
    });

    const moveEvent = new MouseEvent('mousemove', {
      clientX: 100,
      clientY: 100
    });
    card.dispatchEvent(moveEvent);

    expect(inner.style.transform).toContain('rotateX');
    expect(inner.style.transform).toContain('rotateY');
  });

  test('should reset tilt on mouseleave', () => {
    require('./script.js');

    const card = document.querySelector('.floating-card');
    const inner = card.querySelector('.card-inner');

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 140, height: 180
    });

    // Apply tilt
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));

    // Reset
    card.dispatchEvent(new MouseEvent('mouseleave'));

    expect(inner.style.transform).toBe('');
  });

  test('should not apply tilt when animations paused', () => {
    require('./script.js');

    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.click();

    const card = document.querySelector('.floating-card');
    const inner = card.querySelector('.card-inner');

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 140, height: 180
    });

    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));

    expect(inner.style.transform).toBe('');
  });

  test('should not apply tilt when card is flipped', () => {
    require('./script.js');

    const card = document.querySelector('.floating-card');
    const inner = card.querySelector('.card-inner');

    // Flip the card first
    card.click();

    card.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 140, height: 180
    });

    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));

    // Transform should not be changed from the flip state
    expect(inner.style.transform).toBe('');
  });
});

// ============================================
// Parallax Scene Tests
// ============================================
describe('Parallax Scene', () => {
  test('should apply parallax effect on mousemove', () => {
    require('./script.js');

    const container = document.querySelector('.parallax-container');
    const bgLayer = document.querySelector('.parallax-bg');

    container.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 300
    });

    const moveEvent = new MouseEvent('mousemove', {
      clientX: 400,
      clientY: 150
    });
    container.dispatchEvent(moveEvent);

    expect(bgLayer.style.transform).toContain('translate');
  });

  test('should reset parallax on mouseleave', () => {
    require('./script.js');

    const container = document.querySelector('.parallax-container');
    const bgLayer = document.querySelector('.parallax-bg');

    container.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 800, height: 300
    });

    // Apply parallax
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 150 }));

    // Reset
    container.dispatchEvent(new MouseEvent('mouseleave'));

    expect(bgLayer.style.transform).toBe('');
  });

  test('should not apply parallax when paused', () => {
    require('./script.js');

    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.click();

    const container = document.querySelector('.parallax-container');
    const bgLayer = document.querySelector('.parallax-bg');

    container.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 800, height: 300
    });

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 150 }));

    expect(bgLayer.style.transform).toBe('');
  });

  test('should handle touch events for parallax', () => {
    require('./script.js');

    const container = document.querySelector('.parallax-container');
    const bgLayer = document.querySelector('.parallax-bg');

    container.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 800, height: 300
    });

    const touchEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 400, clientY: 150 }]
    });
    container.dispatchEvent(touchEvent);

    expect(bgLayer.style.transform).toContain('translate');
  });
});

// ============================================
// Interactive Sphere Tests
// ============================================
describe('Interactive Sphere', () => {
  test('should pause animation on mousedown', () => {
    require('./script.js');

    const sphere = document.querySelector('.sphere');

    sphere.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));

    expect(sphere.style.animationPlayState).toBe('paused');
  });

  test('should rotate sphere on drag', () => {
    require('./script.js');

    const sphere = document.querySelector('.sphere');

    // Start drag
    sphere.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));

    // Move mouse
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150 }));

    expect(sphere.style.transform).toContain('rotateX');
    expect(sphere.style.transform).toContain('rotateY');
  });

  test('should resume animation on mouseup when not paused', () => {
    require('./script.js');

    const sphere = document.querySelector('.sphere');

    // Start drag
    sphere.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));

    // Release
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(sphere.style.animationPlayState).toBe('');
    expect(sphere.style.transform).toBe('');
  });

  test('should not resume animation on mouseup when globally paused', () => {
    require('./script.js');

    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.click();

    const sphere = document.querySelector('.sphere');

    // Start drag
    sphere.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150 }));

    // Release
    document.dispatchEvent(new MouseEvent('mouseup'));

    // Should keep the custom rotation when paused
    expect(sphere.style.transform).not.toBe('');
  });

  test('should handle touch drag for sphere', () => {
    require('./script.js');

    const sphere = document.querySelector('.sphere');

    // Start touch
    sphere.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    }));

    expect(sphere.style.animationPlayState).toBe('paused');

    // Move touch
    document.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 150 }]
    }));

    expect(sphere.style.transform).toContain('rotateX');
  });

  test('should handle touchend for sphere', () => {
    require('./script.js');

    const sphere = document.querySelector('.sphere');

    sphere.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    }));

    document.dispatchEvent(new TouchEvent('touchend'));

    expect(sphere.style.animationPlayState).toBe('');
  });
});

// ============================================
// Cube Hover Effect Tests
// ============================================
describe('Cube Hover Effect', () => {
  test('should speed up cube animation on mouseenter', () => {
    require('./script.js');

    const cube = document.querySelector('.cube');

    cube.dispatchEvent(new MouseEvent('mouseenter'));

    expect(cube.style.animationDuration).toBe('3s');
  });

  test('should restore cube animation speed on mouseleave', () => {
    require('./script.js');

    const cube = document.querySelector('.cube');

    cube.dispatchEvent(new MouseEvent('mouseenter'));
    cube.dispatchEvent(new MouseEvent('mouseleave'));

    expect(cube.style.animationDuration).toBe('8s');
  });

  test('should restore slow speed on mouseleave when slow is selected', () => {
    localStorageMock.setItem('animation-speed', 'slow');

    require('./script.js');

    const cube = document.querySelector('.cube');

    cube.dispatchEvent(new MouseEvent('mouseenter'));
    cube.dispatchEvent(new MouseEvent('mouseleave'));

    expect(cube.style.animationDuration).toBe('16s');
  });

  test('should restore fast speed on mouseleave when fast is selected', () => {
    localStorageMock.setItem('animation-speed', 'fast');

    require('./script.js');

    const cube = document.querySelector('.cube');

    cube.dispatchEvent(new MouseEvent('mouseenter'));
    cube.dispatchEvent(new MouseEvent('mouseleave'));

    expect(cube.style.animationDuration).toBe('4s');
  });

  test('should not change animation when globally paused on mouseenter', () => {
    require('./script.js');

    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.click();

    const cube = document.querySelector('.cube');
    cube.style.animationDuration = '';

    cube.dispatchEvent(new MouseEvent('mouseenter'));

    expect(cube.style.animationDuration).toBe('');
  });
});

// ============================================
// Reduced Motion Preference Tests
// ============================================
describe('Reduced Motion Preference', () => {
  test('should hide pause button when reduced motion is preferred', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));

    require('./script.js');

    const pauseBtn = document.getElementById('pause-btn');

    expect(pauseBtn.style.display).toBe('none');
  });

  test('should disable speed select when reduced motion is preferred', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));

    require('./script.js');

    const speedSelect = document.getElementById('speed-select');

    expect(speedSelect.disabled).toBe(true);
  });

  test('should respond to reduced motion preference changes', () => {
    let changeCallback;
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: jest.fn((event, cb) => {
        if (event === 'change') changeCallback = cb;
      }),
      removeEventListener: jest.fn()
    }));

    require('./script.js');

    const pauseBtn = document.getElementById('pause-btn');
    const speedSelect = document.getElementById('speed-select');

    // Initially visible
    expect(pauseBtn.style.display).not.toBe('none');
    expect(speedSelect.disabled).not.toBe(true);

    // Simulate preference change
    changeCallback({ matches: true });

    expect(pauseBtn.style.display).toBe('none');
    expect(speedSelect.disabled).toBe(true);
  });

  test('should restore controls when reduced motion preference is disabled', () => {
    let changeCallback;
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn((event, cb) => {
        if (event === 'change') changeCallback = cb;
      }),
      removeEventListener: jest.fn()
    }));

    require('./script.js');

    const pauseBtn = document.getElementById('pause-btn');
    const speedSelect = document.getElementById('speed-select');

    // Initially hidden due to reduced motion
    expect(pauseBtn.style.display).toBe('none');

    // Simulate preference change to no reduced motion
    changeCallback({ matches: false });

    expect(pauseBtn.style.display).toBe('');
    expect(speedSelect.disabled).toBe(false);
  });
});

// ============================================
// Recording Recent Play Tests
// ============================================
describe('Recording Recent Play', () => {
  test('should record 3d-showcase as recently played', () => {
    window.recordRecentPlay = jest.fn();

    require('./script.js');

    expect(window.recordRecentPlay).toHaveBeenCalledWith('3d-showcase');
  });
});

// ============================================
// Accessibility Tests
// ============================================
describe('Accessibility', () => {
  test('all cards should be keyboard focusable', () => {
    require('./script.js');

    const cards = document.querySelectorAll('.floating-card');
    cards.forEach(card => {
      expect(card.getAttribute('tabindex')).toBe('0');
    });
  });

  test('all cards should have role="button"', () => {
    require('./script.js');

    const cards = document.querySelectorAll('.floating-card');
    cards.forEach(card => {
      expect(card.getAttribute('role')).toBe('button');
    });
  });

  test('decorative elements should be aria-hidden', () => {
    require('./script.js');

    const cubeScene = document.querySelector('.cube-scene');
    const parallaxContainer = document.querySelector('.parallax-container');
    const sphereContainer = document.querySelector('.sphere-container');

    expect(cubeScene.getAttribute('aria-hidden')).toBe('true');
    expect(parallaxContainer.getAttribute('aria-hidden')).toBe('true');
    expect(sphereContainer.getAttribute('aria-hidden')).toBe('true');
  });

  test('controls panel should have proper ARIA attributes', () => {
    require('./script.js');

    const controlsPanel = document.querySelector('.controls-panel');
    const speedSelect = document.getElementById('speed-select');

    expect(controlsPanel.getAttribute('role')).toBe('group');
    expect(speedSelect.getAttribute('aria-label')).toBe('Animation speed');
  });
});

// ============================================
// DOM Structure Tests
// ============================================
describe('DOM Structure', () => {
  test('cube should have 6 faces', () => {
    const faces = document.querySelectorAll('.cube-face');
    expect(faces.length).toBe(6);
  });

  test('sphere should have 4 rings and a core', () => {
    const rings = document.querySelectorAll('.sphere-ring');
    const core = document.querySelector('.sphere-core');

    expect(rings.length).toBe(4);
    expect(core).not.toBeNull();
  });

  test('parallax should have 3 layers', () => {
    const layers = document.querySelectorAll('.parallax-layer');
    expect(layers.length).toBe(3);
  });

  test('cards container should have 3 cards', () => {
    const cards = document.querySelectorAll('.floating-card');
    expect(cards.length).toBe(3);
  });
});

// ============================================
// Integration Tests
// ============================================
describe('Integration Tests', () => {
  test('page should initialize without errors', () => {
    expect(() => {
      require('./script.js');
    }).not.toThrow();
  });

  test('all interactive elements should be present', () => {
    require('./script.js');

    expect(document.getElementById('theme-toggle-btn')).not.toBeNull();
    expect(document.getElementById('speed-select')).not.toBeNull();
    expect(document.getElementById('pause-btn')).not.toBeNull();
    expect(document.querySelector('.cube')).not.toBeNull();
    expect(document.querySelector('.floating-card')).not.toBeNull();
    expect(document.querySelector('.parallax-container')).not.toBeNull();
    expect(document.querySelector('.sphere')).not.toBeNull();
  });

  test('multiple speed changes should work correctly', () => {
    require('./script.js');

    const select = document.getElementById('speed-select');

    select.value = 'slow';
    select.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('speed-slow')).toBe(true);

    select.value = 'fast';
    select.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('speed-slow')).toBe(false);
    expect(document.body.classList.contains('speed-fast')).toBe(true);

    select.value = 'normal';
    select.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('speed-fast')).toBe(false);
  });

  test('theme and speed preferences should persist independently', () => {
    require('./script.js');

    const themeBtn = document.getElementById('theme-toggle-btn');
    const speedSelect = document.getElementById('speed-select');

    themeBtn.click();
    speedSelect.value = 'fast';
    speedSelect.dispatchEvent(new Event('change'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('animation-speed', 'fast');
  });
});
