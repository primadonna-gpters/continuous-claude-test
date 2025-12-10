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
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
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

// Stats Manager
class StatsManager {
    constructor() {
        this.statsGrid = document.getElementById('stats-grid');
        if (this.statsGrid) {
            this.render();
        }
    }

    getGameStats() {
        return [
            { icon: '🔢', label: '2048 Best', key: '2048-best-score', format: 'number' },
            { icon: '🐍', label: 'Snake Best', key: 'snake-best-score', format: 'number' },
            { icon: '🧱', label: 'Tetris Best', key: 'tetris-best-score', format: 'number' },
            { icon: '🏓', label: 'Breakout Best', key: 'breakout-best-score', format: 'number' },
            { icon: '🧠', label: 'Memory (Easy)', key: 'memory-best-easy', format: 'moves' },
            { icon: '🧛', label: 'Survivor Best', key: 'survivor-best-time', format: 'time' }
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
                <div class="stat-card">
                    <div class="stat-card-icon">${stat.icon}</div>
                    <div class="stat-card-value">${displayValue}</div>
                    <div class="stat-card-label">${stat.label}</div>
                </div>
            `;
        }).join('');

        this.statsGrid.innerHTML = html;
    }
}

// Recent Games Manager
class RecentGamesManager {
    constructor() {
        this.section = document.getElementById('recent-section');
        this.games = {
            '2048': { icon: '🔢', url: 'games/2048/index.html' },
            'snake': { icon: '🐍', url: 'games/snake/index.html' },
            'minesweeper': { icon: '💣', url: 'games/minesweeper/index.html' },
            'tetris': { icon: '🧱', url: 'games/tetris/index.html' },
            'breakout': { icon: '🏓', url: 'games/breakout/index.html' },
            'memory': { icon: '🧠', url: 'games/memory/index.html' },
            'survivor': { icon: '🧛', url: 'games/survivor/index.html' }
        };
        this.render();
    }

    render() {
        const recent = JSON.parse(localStorage.getItem('recent-games') || '[]');
        if (recent.length === 0) {
            this.section.style.display = 'none';
            return;
        }

        const recentGames = recent.slice(0, 3).map(name => {
            const game = this.games[name];
            if (!game) return '';
            return `
                <a href="${game.url}" class="recent-game-card">
                    <span class="recent-game-icon">${game.icon}</span>
                    <span class="recent-game-name">${name}</span>
                </a>
            `;
        }).join('');

        this.section.innerHTML = `
            <p class="recent-title">최근 플레이</p>
            <div class="recent-games">${recentGames}</div>
        `;
    }
}

// 3D Tilt Effect Manager for game cards
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
        card.style.transition = 'none';
    }

    handleTilt(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 8 degrees)
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }

    resetTilt(card) {
        card.style.transition = 'transform 0.3s ease';
        card.style.transform = '';
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

document.addEventListener('DOMContentLoaded', () => {
    new HubThemeManager();
    new ScrollAnimationManager();
    new StatsManager();
    new RecentGamesManager();
    new TiltEffectManager();
    registerServiceWorker();
});

// Export for testing (CommonJS compatible)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HubThemeManager,
        ScrollAnimationManager,
        StatsManager,
        RecentGamesManager,
        TiltEffectManager,
        registerServiceWorker
    };
}
