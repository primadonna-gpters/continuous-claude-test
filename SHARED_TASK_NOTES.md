# Implementation Plan

## Overview
Add 3 new games to the existing Game Hub. The hub currently has 7 games (2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor). This task will add 3 additional classic/casual games to enhance the collection.

## Recommended New Games
Based on the existing game types and patterns, the following 3 games are recommended:
1. **Flappy Bird** - Simple tap-to-fly arcade game (good contrast to existing games)
2. **Pong** - Classic paddle/ball game (single player vs AI)
3. **Wordle** - Word guessing puzzle game (adds word-based gameplay variety)

## Project Structure Pattern
Each game must follow this structure:
```
games/{game-name}/
├── index.html    # Game page with standard layout
├── style.css     # Game-specific styling
├── game.js       # Game logic class
└── game.test.js  # Unit tests (optional but recommended)
```

## Steps

### 1. [x] Create Flappy Bird Game
- **Files to create:**
  - `games/flappy/index.html` - Game page following Memory/Tetris pattern
  - `games/flappy/style.css` - Game-specific styles
  - `games/flappy/game.js` - FlappyBird class with canvas-based gameplay
- **Key features:**
  - Canvas-based rendering
  - Touch/click/spacebar controls
  - Score tracking with best score in localStorage
  - Sound effects (optional, SoundManager pattern)
  - Difficulty progression (pipes get closer)
- **Criteria:** Game loads, bird flaps, pipes scroll, collision detection works, score displays

### 2. [x] Create Pong Game
- **Files to create:**
  - `games/pong/index.html` - Game page following existing pattern
  - `games/pong/style.css` - Game-specific styles
  - `games/pong/game.js` - Pong class with canvas-based gameplay
- **Key features:**
  - Canvas-based rendering
  - Mouse/touch/keyboard controls for paddle
  - AI opponent with adjustable difficulty
  - Score tracking (first to 11 wins)
  - Sound effects (optional)
- **Criteria:** Paddles move, ball bounces, AI plays, scoring works

### 3. [x] Create Wordle Game
- **Files to create:**
  - `games/wordle/index.html` - Game page following existing pattern
  - `games/wordle/style.css` - Game-specific styles
  - `games/wordle/game.js` - Wordle class with grid-based gameplay
- **Key features:**
  - 6 attempts to guess 5-letter word
  - Color feedback (green=correct, yellow=wrong position, gray=not in word)
  - Virtual keyboard with color hints
  - Word list for valid guesses and solutions
  - Statistics tracking (win rate, streak)
  - Share results feature
- **Criteria:** Keyboard input works, color feedback displays correctly, win/lose detection works

### 4. [x] Register Games in Hub
- **Files to modify:**
  - `hub.js` - Add 3 new entries to `this.games` object in `RecentGamesManager` (~line 619)
  - `index.html` - Add 3 new game cards to `.games-grid` section
- **New registry entries:**
  ```javascript
  'flappy': { icon: '🐤', url: 'games/flappy/index.html', displayName: 'Flappy Bird' },
  'pong': { icon: '🏓', url: 'games/pong/index.html', displayName: 'Pong' },
  'wordle': { icon: '📝', url: 'games/wordle/index.html', displayName: 'Wordle' }
  ```
- **Criteria:** All 3 new games appear on hub page, clicking navigates to game, recent games tracking works

### 5. [x] Update Meta Description
- **File to modify:**
  - `index.html` - Update meta description to include new games
- **Criteria:** Meta description lists all 10 games

## Technical Requirements

### HTML Template Pattern (from Memory game)
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{Game Name}</title>
    <link rel="stylesheet" href="../../common.css">
    <link rel="stylesheet" href="style.css">
</head>
<body class="animated-bg">
    <div class="container fade-in">
        <header>
            <div class="header-left">
                <a href="../../index.html" class="back-btn back-btn-enhanced">← Hub</a>
                <h1>{Icon} {Name}</h1>
            </div>
            <div class="score-container">
                <!-- Score boxes -->
            </div>
        </header>
        <!-- Game content -->
        <div class="instructions">
            <p><strong>조작 방법:</strong> ...</p>
        </div>
    </div>
    <script src="../../common.js"></script>
    <script src="game.js"></script>
</body>
</html>
```

### Game Card Template (from index.html)
```html
<a href="games/{name}/index.html" class="game-card" role="listitem" aria-label="{name} 게임 - {description}">
    <div class="game-card-icon" aria-hidden="true">{emoji}</div>
    <div class="game-card-content">
        <h3>{Display Name}</h3>
        <p>{Korean description}!</p>
    </div>
    <div class="game-card-arrow" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    </div>
    <div class="game-card-info-overlay" aria-hidden="true">
        <div class="game-card-controls">
            <span class="game-card-control-icon">⌨️ {controls}</span>
            <span class="game-card-control-icon">📱 {mobile-controls}</span>
        </div>
        <div class="game-card-meta">
            <span class="game-card-meta-item">⏱️ {time}</span>
            <span class="game-card-meta-item">난이도 <span class="game-card-difficulty">...</span></span>
        </div>
    </div>
</a>
```

### Common Features Each Game Must Have
1. **Theme toggle** (dark/light mode) - Use existing pattern
2. **Sound toggle** - Use existing SoundManager pattern
3. **Best score persistence** - localStorage
4. **Recent play tracking** - Call `recordRecentPlay('{gamename}')` from common.js
5. **Responsive design** - Mobile-friendly controls
6. **Accessibility** - aria-labels, keyboard navigation

## Notes for Developer

### Execution Order
1. Create all 3 game directories and files first
2. Implement game logic for each
3. Add to hub registry last (ensures games work before being visible)

### Styling Guidelines
- Use CSS variables from common.css (--color-*, --spacing-*, etc.)
- Follow existing glassmorphism patterns (.glass, .score-box-glass)
- Dark mode: Use `body.dark-mode` selectors
- Animations: Use existing animation classes from common.css

### Testing
- Test keyboard controls
- Test touch/mobile controls
- Test dark mode appearance
- Test localStorage persistence (scores, theme preference)
- Verify back button returns to hub correctly

### localStorage Keys Convention
- `{gamename}-best-score` - Best score
- `{gamename}-sound` - Sound preference (true/false)
- `{gamename}-*` - Game-specific settings

## Session Info
> Session: 20251211-141404-53670-2340

---

## Developer Implementation Notes

### Completed Steps
All 5 steps have been completed successfully:

1. **Flappy Bird Game** - `games/flappy/`
   - Canvas-based game with gravity physics
   - Click/tap/spacebar controls for jumping
   - Pipes spawn with random gaps
   - Score increases when passing pipes
   - Best score saved to localStorage
   - Sound effects for jump, score, and hit

2. **Pong Game** - `games/pong/`
   - Canvas-based game with AI opponent
   - 3 difficulty levels (Easy/Medium/Hard)
   - Mouse, touch, and keyboard controls
   - First to 11 points wins
   - Game statistics tracked in localStorage

3. **Wordle Game** - `games/wordle/`
   - DOM-based 6x5 grid with virtual keyboard
   - ~500 common 5-letter English words
   - Green/Yellow/Gray color feedback
   - Win streak and total wins tracking
   - Tile flip animations

4. **Hub Registration** - Updated `hub.js` and `index.html`
   - Added 3 new game entries to RecentGamesManager
   - Added 3 new game entries to TouchInteractionManager
   - Updated FooterStatsManager from /8 to /10 games
   - Added 3 new game cards with "New" badges

5. **Meta Description** - Updated in `index.html`
   - Now lists all 10 games

### Files Created
- `games/flappy/index.html`, `style.css`, `game.js`
- `games/pong/index.html`, `style.css`, `game.js`
- `games/wordle/index.html`, `style.css`, `game.js`

### Files Modified
- `hub.js` - Added game registrations
- `index.html` - Added game cards and updated meta description

### Notes for Tester
1. **Flappy Bird**: Test click/tap/spacebar controls, check if bird falls with gravity and flaps up on input
2. **Pong**: Test all 3 difficulty levels, verify AI opponent works correctly
3. **Wordle**: Test virtual keyboard and physical keyboard input, verify color feedback (green=correct position, yellow=in word but wrong position, gray=not in word)
4. **All Games**: Verify dark mode toggle, sound toggle, and back button to hub
5. **Hub Page**: Check that all 3 new games appear with "New" badges, recent games tracking works

## Status: Implementation Complete

AGENT_TASK_COMPLETE
