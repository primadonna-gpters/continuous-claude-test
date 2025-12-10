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

// Export for testing (CommonJS compatible)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recordRecentPlay };
}
