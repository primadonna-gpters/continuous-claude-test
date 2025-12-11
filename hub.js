// Page Loader Manager
class PageLoaderManager {
    constructor() {
        this.loader = document.getElementById('page-loader');
        if (this.loader) {
            this.hideLoader();
        }
    }

    hideLoader() {
        // Small delay to ensure content is ready
        setTimeout(() => {
            this.loader.classList.add('loaded');
        }, 500);
    }
}

// Scroll Progress Manager
class ScrollProgressManager {
    constructor() {
        this.progressBar = document.getElementById('scroll-progress');
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this.progressBar && !this.prefersReducedMotion) {
            this.bindEvents();
        }
    }

    bindEvents() {
        window.addEventListener('scroll', () => this.updateProgress(), { passive: true });
    }

    updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        this.progressBar.style.width = `${progress}%`;
    }
}

// Ripple Effect Manager
class RippleEffectManager {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this.prefersReducedMotion) return;

        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.game-card, #theme-toggle-btn').forEach(element => {
            element.addEventListener('click', (e) => this.createRipple(e, element));
        });
    }

    createRipple(e, element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);

        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

        element.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }
}

// Particle System for background effects
class ParticleSystem {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this.prefersReducedMotion) {
            return;
        }

        this.container = null;
        this.particles = [];
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.animationId = null;

        this.init();
        this.bindEvents();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'particles-container';
        document.body.prepend(this.container);

        // Create particles
        const particleCount = window.innerWidth < 768 ? 12 : 20;
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(i);
        }

        // Create geometric shapes
        const shapeCount = window.innerWidth < 768 ? 6 : 10;
        for (let i = 0; i < shapeCount; i++) {
            this.createShape(i);
        }

        this.animate();
    }

    createParticle(index) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 8 + 4;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const delay = Math.random() * 20;
        const duration = 15 + Math.random() * 10;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(143, 122, 102, 0.5), rgba(143, 122, 102, 0.1));
            animation-delay: ${-delay}s;
            animation-duration: ${duration}s;
        `;

        this.container.appendChild(particle);
        this.particles.push({
            element: particle,
            baseX: x,
            baseY: y,
            offsetX: 0,
            offsetY: 0,
            speed: 0.02 + Math.random() * 0.03
        });
    }

    createShape(index) {
        const shape = document.createElement('div');
        const shapes = ['square', 'triangle'];
        const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
        shape.className = `particle-shape ${shapeType}`;

        const size = Math.random() * 20 + 10;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const delay = Math.random() * 20;
        const duration = 20 + Math.random() * 15;

        if (shapeType === 'square') {
            shape.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(143, 122, 102, 0.2);
                animation: particleFloatAlt ${duration}s ease-in-out infinite;
                animation-delay: ${-delay}s;
            `;
        } else {
            shape.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                animation: particleFloatAlt ${duration}s ease-in-out infinite;
                animation-delay: ${-delay}s;
            `;
        }

        this.container.appendChild(shape);
        this.particles.push({
            element: shape,
            baseX: x,
            baseY: y,
            offsetX: 0,
            offsetY: 0,
            speed: 0.01 + Math.random() * 0.02
        });
    }

    bindEvents() {
        let ticking = false;
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, { passive: true });

        // Update dark mode particles
        const observer = new MutationObserver(() => {
            this.updateParticleColors();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    updateParticleColors() {
        const isDark = document.body.classList.contains('dark-mode');
        this.particles.forEach(p => {
            if (p.element.classList.contains('particle')) {
                p.element.style.background = isDark
                    ? 'radial-gradient(circle, rgba(138, 138, 209, 0.5), rgba(138, 138, 209, 0.1))'
                    : 'radial-gradient(circle, rgba(143, 122, 102, 0.5), rgba(143, 122, 102, 0.1))';
            } else if (p.element.classList.contains('square')) {
                p.element.style.background = isDark
                    ? 'rgba(138, 138, 209, 0.2)'
                    : 'rgba(143, 122, 102, 0.2)';
            }
        });
    }

    animate() {
        this.particles.forEach(p => {
            // Calculate direction towards mouse
            const dx = this.mouseX - p.baseX;
            const dy = this.mouseY - p.baseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Particles move away from cursor when close, follow when far
            const maxInfluence = 200;
            if (distance < maxInfluence) {
                const influence = (maxInfluence - distance) / maxInfluence;
                p.offsetX += (-dx / distance) * influence * 0.5;
                p.offsetY += (-dy / distance) * influence * 0.5;
            }

            // Smooth return to base position
            p.offsetX *= 0.95;
            p.offsetY *= 0.95;

            // Apply offset transform (using translateX/Y for GPU acceleration)
            const currentTransform = p.element.style.transform || '';
            if (!currentTransform.includes('translate(')) {
                p.element.style.transform = `translate(${p.offsetX}px, ${p.offsetY}px)`;
            }
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.container) {
            this.container.remove();
        }
    }
}

// Theme management for hub
class HubThemeManager {
    constructor() {
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.loadTheme();
        this.bindEvents();
    }

    bindEvents() {
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('game-hub-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
            this.updateAriaPressed(true);
        } else {
            this.updateAriaPressed(false);
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
        this.updateAriaPressed(isDark);
    }

    updateAriaPressed(isDark) {
        if (this.themeToggleBtn) {
            this.themeToggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        }
    }
}

// Page Transition Handler for game cards
class PageTransitionHandler {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this.prefersReducedMotion) {
            return;
        }

        this.bindEvents();
    }

    bindEvents() {
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleCardClick(e, card));
        });
    }

    handleCardClick(e, card) {
        e.preventDefault();
        const href = card.getAttribute('href');
        if (!href) return;

        // Store that we're coming from hub for enter animation
        sessionStorage.setItem('from-hub', 'true');

        // Get card position for animation
        const rect = card.getBoundingClientRect();

        // Create expanding overlay
        const overlay = document.createElement('div');
        overlay.className = 'card-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background: ${window.getComputedStyle(card).background};
            border-radius: 16px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);

        // Animate the card scaling up
        card.style.transition = 'none';
        card.style.transform = 'scale(1.05)';
        card.style.opacity = '0';

        // Animate overlay to full screen
        requestAnimationFrame(() => {
            overlay.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.borderRadius = '0';
        });

        // Navigate after animation
        setTimeout(() => {
            window.location.href = href;
        }, 380);
    }
}

// Scroll-based animation manager
class ScrollAnimationManager {
    constructor() {
        this.initIntersectionObserver();
    }

    initIntersectionObserver() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            document.querySelectorAll('.game-card').forEach(card => {
                card.classList.add('animate-in');
            });
            return;
        }

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.game-card').forEach(card => {
            observer.observe(card);
        });
    }
}

// Stats Manager with count-up animation
class StatsManager {
    constructor() {
        this.statsGrid = document.getElementById('stats-grid');
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this.statsGrid) {
            this.render();
            if (!this.prefersReducedMotion) {
                this.initCountUpAnimation();
            }
        }
    }

    getGameStats() {
        return [
            { icon: '🔢', label: '2048 Best', key: '2048-best-score', format: 'number', tooltip: '2048 게임 최고 점수' },
            { icon: '🐍', label: 'Snake Best', key: 'snake-best-score', format: 'number', tooltip: 'Snake 게임 최고 점수' },
            { icon: '🧱', label: 'Tetris Best', key: 'tetris-best-score', format: 'number', tooltip: 'Tetris 게임 최고 점수' },
            { icon: '🏓', label: 'Breakout Best', key: 'breakout-best-score', format: 'number', tooltip: 'Breakout 게임 최고 점수' },
            { icon: '🧠', label: 'Memory (Easy)', key: 'memory-best-easy', format: 'moves', tooltip: 'Memory 게임 최소 이동 수' },
            { icon: '🧛', label: 'Survivor Best', key: 'survivor-best-time', format: 'time', tooltip: 'Survivor 게임 최장 생존 시간' }
        ];
    }

    formatValue(value, format) {
        if (value === null || value === 0) return '-';
        switch (format) {
            case 'time':
                const mins = Math.floor(value / 60);
                const secs = value % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            case 'moves':
                return `${value}`;
            default:
                return value.toLocaleString();
        }
    }

    render() {
        const stats = this.getGameStats();
        const html = stats.map(stat => {
            const rawValue = localStorage.getItem(stat.key);
            const value = rawValue ? parseInt(rawValue) : 0;
            const displayValue = this.formatValue(value, stat.format);

            return `
                <div class="stat-card" data-value="${value}" data-format="${stat.format}">
                    <div class="stat-card-tooltip">${stat.tooltip}</div>
                    <div class="stat-card-icon">${stat.icon}</div>
                    <div class="stat-card-value" data-target="${value}">${displayValue}</div>
                    <div class="stat-card-label">${stat.label}</div>
                </div>
            `;
        }).join('');

        this.statsGrid.innerHTML = html;
    }

    initCountUpAnimation() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.3
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCountUp(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.stat-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateCountUp(card) {
        const valueEl = card.querySelector('.stat-card-value');
        const target = parseInt(valueEl.dataset.target) || 0;
        const format = card.dataset.format;

        if (target === 0 || format === 'time') return;

        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(target * easeOutQuart);

            valueEl.textContent = this.formatValue(current, format);
            valueEl.classList.add('counting');

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                valueEl.classList.remove('counting');
                valueEl.textContent = this.formatValue(target, format);
            }
        };

        requestAnimationFrame(animate);
    }
}

// Recent Games Manager with play time tracking
class RecentGamesManager {
    constructor() {
        this.section = document.getElementById('recent-section');
        this.games = {
            '2048': { icon: '🔢', url: 'games/2048/index.html', displayName: '2048' },
            'snake': { icon: '🐍', url: 'games/snake/index.html', displayName: 'Snake' },
            'minesweeper': { icon: '💣', url: 'games/minesweeper/index.html', displayName: 'Minesweeper' },
            'tetris': { icon: '🧱', url: 'games/tetris/index.html', displayName: 'Tetris' },
            'breakout': { icon: '🏓', url: 'games/breakout/index.html', displayName: 'Breakout' },
            'memory': { icon: '🧠', url: 'games/memory/index.html', displayName: 'Memory' },
            'survivor': { icon: '🧛', url: 'games/survivor/index.html', displayName: 'Survivor' }
        };
        this.render();
    }

    getRelativeTime(timestamp) {
        if (!timestamp) return '';
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return '';
    }

    render() {
        const recent = JSON.parse(localStorage.getItem('recent-games') || '[]');
        const timestamps = JSON.parse(localStorage.getItem('recent-games-timestamps') || '{}');

        if (recent.length === 0) {
            this.section.style.display = 'none';
            return;
        }

        const recentGames = recent.slice(0, 3).map(name => {
            const game = this.games[name];
            if (!game) return '';
            const relativeTime = this.getRelativeTime(timestamps[name]);

            return `
                <a href="${game.url}" class="recent-game-card">
                    <span class="recent-game-icon">${game.icon}</span>
                    <span class="recent-game-info">
                        <span class="recent-game-name">${game.displayName}</span>
                        ${relativeTime ? `<span class="recent-game-time">${relativeTime}</span>` : ''}
                    </span>
                </a>
            `;
        }).join('');

        this.section.innerHTML = `
            <p class="recent-title">최근 플레이</p>
            <div class="recent-games">${recentGames}</div>
        `;
    }
}

// Parallax Effect Manager for header
class ParallaxManager {
    constructor() {
        this.header = document.querySelector('.hub-header');
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this.prefersReducedMotion || !this.header) {
            return;
        }

        this.bindEvents();
    }

    bindEvents() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const translateY = scrollY * 0.3;
        const opacity = Math.max(0, 1 - scrollY / 300);

        this.header.style.transform = `translateY(${translateY}px)`;
        this.header.style.opacity = opacity;
    }
}

// Enhanced 3D Tilt Effect Manager for game cards
class TiltEffectManager {
    constructor() {
        this.cards = document.querySelectorAll('.game-card');
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Skip tilt effect for reduced motion or touch devices
        if (this.prefersReducedMotion || this.isTouchDevice) {
            return;
        }

        this.bindEvents();
    }

    bindEvents() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleTilt(e, card));
            card.addEventListener('mouseleave', () => this.resetTilt(card));
            card.addEventListener('mouseenter', () => this.activateTilt(card));
        });
    }

    activateTilt(card) {
        card.style.transition = 'box-shadow 0.1s ease';
    }

    handleTilt(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 12 degrees for more dramatic effect)
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        // Calculate lift amount based on distance from center
        const distanceFromCenter = Math.sqrt(
            Math.pow((x - centerX) / centerX, 2) +
            Math.pow((y - centerY) / centerY, 2)
        );
        const translateZ = 30 + (1 - Math.min(distanceFromCenter, 1)) * 20;
        const translateY = -10 - (1 - Math.min(distanceFromCenter, 1)) * 5;

        // Dynamic shadow based on tilt direction
        const shadowX = -rotateY * 2;
        const shadowY = rotateX * 2 + 25;

        card.style.transform = `
            perspective(1000px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            translateY(${translateY}px)
            translateZ(${translateZ}px)
            scale(1.03)
        `;

        card.style.boxShadow = `
            ${shadowX}px ${shadowY}px 50px rgba(0, 0, 0, 0.3),
            ${shadowX * 0.5}px ${shadowY * 0.5}px 25px rgba(0, 0, 0, 0.2),
            0 0 40px rgba(143, 122, 102, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `;
    }

    resetTilt(card) {
        card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.5s ease';
        card.style.transform = '';
        card.style.boxShadow = '';
    }
}

// Service Worker registration for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration.scope);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
}

// Typing Effect Manager for subtitle
class TypingEffectManager {
    constructor() {
        this.subtitle = document.querySelector('.hub-subtitle');
        if (this.subtitle) {
            this.init();
        }
    }

    init() {
        // Remove cursor after typing animation completes (2.5s typing + 3s blink = 5.5s total)
        setTimeout(() => {
            if (this.subtitle) {
                this.subtitle.classList.add('typing-done');
            }
        }, 5500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PageLoaderManager();
    new ScrollProgressManager();
    new RippleEffectManager();
    new ParticleSystem();
    new HubThemeManager();
    new ScrollAnimationManager();
    new StatsManager();
    new RecentGamesManager();
    new TiltEffectManager();
    new ParallaxManager();
    new PageTransitionHandler();
    new TypingEffectManager();
    registerServiceWorker();
});

// Export for testing (CommonJS compatible)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PageLoaderManager,
        ScrollProgressManager,
        RippleEffectManager,
        ParticleSystem,
        HubThemeManager,
        ScrollAnimationManager,
        StatsManager,
        RecentGamesManager,
        TiltEffectManager,
        ParallaxManager,
        PageTransitionHandler,
        TypingEffectManager,
        registerServiceWorker
    };
}
