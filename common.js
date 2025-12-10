// Common utility functions for all games

/**
 * Record a game as recently played in localStorage.
 * Stores up to 5 most recent games, with the most recent at index 0.
 * @param {string} gameName - The name of the game (e.g., '2048', 'snake')
 */
function recordRecentPlay(gameName) {
    const recent = JSON.parse(localStorage.getItem('recent-games') || '[]');
    const filtered = recent.filter(g => g !== gameName);
    filtered.unshift(gameName);
    localStorage.setItem('recent-games', JSON.stringify(filtered.slice(0, 5)));
}

/**
 * Animation utility class for common game effects
 */
class GameAnimations {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Trigger score pulse animation on an element
     * @param {HTMLElement} element - The score element to animate
     * @param {boolean} isLarge - Whether this is a large score increase
     */
    pulseScore(element, isLarge = false) {
        if (this.prefersReducedMotion || !element) return;

        element.classList.remove('score-pulse', 'score-pop');
        // Force reflow
        void element.offsetWidth;
        element.classList.add(isLarge ? 'score-pop' : 'score-pulse');

        element.addEventListener('animationend', () => {
            element.classList.remove('score-pulse', 'score-pop');
        }, { once: true });
    }

    /**
     * Trigger win celebration effect on game container
     * @param {HTMLElement} element - The game container element
     */
    celebrateWin(element) {
        if (this.prefersReducedMotion || !element) return;

        element.classList.add('win-effect');
        element.addEventListener('animationend', () => {
            element.classList.remove('win-effect');
        }, { once: true });
    }

    /**
     * Trigger lose/game over shake effect
     * @param {HTMLElement} element - The game container element
     */
    shakeOnLose(element) {
        if (this.prefersReducedMotion || !element) return;

        element.classList.add('lose-effect');
        element.addEventListener('animationend', () => {
            element.classList.remove('lose-effect');
        }, { once: true });
    }

    /**
     * Flash effect for special events (line clear, match, etc.)
     * @param {HTMLElement} element - The element to flash
     */
    flash(element) {
        if (this.prefersReducedMotion || !element) return;

        element.classList.add('flash-effect');
        element.addEventListener('animationend', () => {
            element.classList.remove('flash-effect');
        }, { once: true });
    }

    /**
     * Page enter animation
     * @param {HTMLElement} element - The page/container element
     */
    pageEnter(element) {
        if (this.prefersReducedMotion || !element) return;

        element.classList.add('page-enter');
    }

    /**
     * Create a subtle tilt effect manager for an element
     * @param {HTMLElement} element - The element to apply tilt effect
     * @returns {Object} Methods to enable/disable tilt
     */
    createTiltEffect(element) {
        if (this.prefersReducedMotion || !element) {
            return { enable: () => {}, disable: () => {} };
        }

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            return { enable: () => {}, disable: () => {} };
        }

        const handleMouseMove = (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        const handleMouseLeave = () => {
            element.style.transition = 'transform 0.3s ease';
            element.style.transform = '';
        };

        const handleMouseEnter = () => {
            element.style.transition = 'none';
        };

        return {
            enable: () => {
                element.addEventListener('mousemove', handleMouseMove);
                element.addEventListener('mouseleave', handleMouseLeave);
                element.addEventListener('mouseenter', handleMouseEnter);
            },
            disable: () => {
                element.removeEventListener('mousemove', handleMouseMove);
                element.removeEventListener('mouseleave', handleMouseLeave);
                element.removeEventListener('mouseenter', handleMouseEnter);
                element.style.transform = '';
            }
        };
    }
}

// Create a singleton instance
const gameAnimations = new GameAnimations();

// Export for testing (CommonJS compatible)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recordRecentPlay, GameAnimations, gameAnimations };
}
