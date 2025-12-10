/**
 * 3D Showcase - Interactive JavaScript Controls
 * Provides animation controls, mouse/touch interaction, and theme management
 */

(function() {
    'use strict';

    // Record this page as recently played
    if (typeof recordRecentPlay === 'function') {
        recordRecentPlay('3d-showcase');
    }

    // DOM Elements
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const speedSelect = document.getElementById('speed-select');
    const pauseBtn = document.getElementById('pause-btn');
    const pauseIcon = pauseBtn?.querySelector('.pause-icon');
    const playIcon = pauseBtn?.querySelector('.play-icon');
    const btnText = pauseBtn?.querySelector('.btn-text');
    const floatingCards = document.querySelectorAll('.floating-card');
    const parallaxContainer = document.querySelector('.parallax-container');
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    const sphere = document.querySelector('.sphere');
    const cube = document.querySelector('.cube');

    // State
    let isPaused = false;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let sphereRotation = { x: 0, y: 0 };

    // ==========================================
    // THEME MANAGEMENT
    // ==========================================

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // ==========================================
    // ANIMATION SPEED CONTROL
    // ==========================================

    function initSpeed() {
        const savedSpeed = localStorage.getItem('animation-speed') || 'normal';
        speedSelect.value = savedSpeed;
        applySpeed(savedSpeed);
    }

    function applySpeed(speed) {
        document.body.classList.remove('speed-slow', 'speed-normal', 'speed-fast');
        if (speed !== 'normal') {
            document.body.classList.add('speed-' + speed);
        }
        localStorage.setItem('animation-speed', speed);
    }

    // ==========================================
    // PAUSE/PLAY CONTROL
    // ==========================================

    function togglePause() {
        isPaused = !isPaused;
        document.body.classList.toggle('animations-paused', isPaused);

        if (pauseIcon && playIcon && btnText) {
            pauseIcon.classList.toggle('hidden', isPaused);
            playIcon.classList.toggle('hidden', !isPaused);
            btnText.textContent = isPaused ? 'Play' : 'Pause';
        }

        pauseBtn?.setAttribute('aria-label', isPaused ? 'Play animations' : 'Pause animations');
    }

    // ==========================================
    // FLOATING CARDS - FLIP INTERACTION
    // ==========================================

    function initFloatingCards() {
        floatingCards.forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.classList.toggle('flipped');
                }
            });

            // Mouse tilt effect
            card.addEventListener('mousemove', (e) => {
                if (isPaused) return;

                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                const inner = card.querySelector('.card-inner');
                if (inner && !card.classList.contains('flipped')) {
                    inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                const inner = card.querySelector('.card-inner');
                if (inner && !card.classList.contains('flipped')) {
                    inner.style.transform = '';
                }
            });
        });
    }

    // ==========================================
    // PARALLAX SCENE - MOUSE TRACKING
    // ==========================================

    function initParallax() {
        if (!parallaxContainer) return;

        parallaxContainer.addEventListener('mousemove', (e) => {
            if (isPaused) return;

            const rect = parallaxContainer.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            parallaxLayers.forEach((layer, index) => {
                const depth = (index + 1) * 10;
                const moveX = x * depth;
                const moveY = y * depth;

                // Get base transform from class
                let baseTransform = '';
                if (layer.classList.contains('parallax-bg')) {
                    baseTransform = 'translateZ(-200px) scale(2)';
                } else if (layer.classList.contains('parallax-mid')) {
                    baseTransform = 'translateZ(-100px) scale(1.5)';
                } else {
                    baseTransform = 'translateZ(0px) scale(1)';
                }

                layer.style.transform = `${baseTransform} translate(${moveX}px, ${moveY}px)`;
            });
        });

        parallaxContainer.addEventListener('mouseleave', () => {
            parallaxLayers.forEach(layer => {
                layer.style.transform = '';
            });
        });

        // Touch support
        parallaxContainer.addEventListener('touchmove', (e) => {
            if (isPaused || e.touches.length === 0) return;

            const touch = e.touches[0];
            const rect = parallaxContainer.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width - 0.5;
            const y = (touch.clientY - rect.top) / rect.height - 0.5;

            parallaxLayers.forEach((layer, index) => {
                const depth = (index + 1) * 10;
                const moveX = x * depth;
                const moveY = y * depth;

                let baseTransform = '';
                if (layer.classList.contains('parallax-bg')) {
                    baseTransform = 'translateZ(-200px) scale(2)';
                } else if (layer.classList.contains('parallax-mid')) {
                    baseTransform = 'translateZ(-100px) scale(1.5)';
                } else {
                    baseTransform = 'translateZ(0px) scale(1)';
                }

                layer.style.transform = `${baseTransform} translate(${moveX}px, ${moveY}px)`;
            });
        });
    }

    // ==========================================
    // INTERACTIVE SPHERE - DRAG ROTATION
    // ==========================================

    function initSphere() {
        if (!sphere) return;

        sphere.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            sphere.style.animationPlayState = 'paused';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            sphereRotation.y += deltaX * 0.5;
            sphereRotation.x -= deltaY * 0.5;

            sphere.style.transform = `rotateX(${sphereRotation.x}deg) rotateY(${sphereRotation.y}deg)`;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (!isPaused) {
                    sphere.style.animationPlayState = '';
                    sphere.style.transform = '';
                }
            }
        });

        // Touch support for sphere
        sphere.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
                sphere.style.animationPlayState = 'paused';
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length === 0) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - previousMousePosition.x;
            const deltaY = touch.clientY - previousMousePosition.y;

            sphereRotation.y += deltaX * 0.5;
            sphereRotation.x -= deltaY * 0.5;

            sphere.style.transform = `rotateX(${sphereRotation.x}deg) rotateY(${sphereRotation.y}deg)`;

            previousMousePosition = { x: touch.clientX, y: touch.clientY };
        });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                if (!isPaused) {
                    sphere.style.animationPlayState = '';
                    sphere.style.transform = '';
                }
            }
        });
    }

    // ==========================================
    // CUBE - HOVER PAUSE/SPEED
    // ==========================================

    function initCube() {
        if (!cube) return;

        cube.addEventListener('mouseenter', () => {
            if (!isPaused) {
                cube.style.animationDuration = '3s';
            }
        });

        cube.addEventListener('mouseleave', () => {
            if (!isPaused) {
                // Restore based on speed setting
                const speed = speedSelect.value;
                let duration = '8s';
                if (speed === 'slow') duration = '16s';
                if (speed === 'fast') duration = '4s';
                cube.style.animationDuration = duration;
            }
        });
    }

    // ==========================================
    // REDUCED MOTION CHECK
    // ==========================================

    function checkReducedMotion() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (mediaQuery.matches) {
            // Disable animation controls for users who prefer reduced motion
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (speedSelect) speedSelect.disabled = true;
        }

        // Listen for changes
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) {
                if (pauseBtn) pauseBtn.style.display = 'none';
                if (speedSelect) speedSelect.disabled = true;
            } else {
                if (pauseBtn) pauseBtn.style.display = '';
                if (speedSelect) speedSelect.disabled = false;
            }
        });
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    function initEventListeners() {
        themeToggleBtn?.addEventListener('click', toggleTheme);

        speedSelect?.addEventListener('change', (e) => {
            applySpeed(e.target.value);
        });

        pauseBtn?.addEventListener('click', togglePause);
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        initTheme();
        initSpeed();
        initEventListeners();
        initFloatingCards();
        initParallax();
        initSphere();
        initCube();
        checkReducedMotion();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
