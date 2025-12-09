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

document.addEventListener('DOMContentLoaded', () => {
    new HubThemeManager();
});
