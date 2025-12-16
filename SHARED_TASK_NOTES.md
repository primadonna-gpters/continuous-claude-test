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

---

## Test Results

### Summary
- **Tests Written**: 195 new tests for the 3 new games
- **Tests Passing**: 195/195 (100%)
- **Total Project Tests**: 816/816 (100%)

### Test Coverage by Game

#### Flappy Bird (`games/flappy/game.test.js`)
- **Tests**: 65 tests
- **Coverage Areas**:
  - Initialization and defaults
  - Canvas setup
  - Theme management (dark/light mode toggle)
  - Sound management (toggle, button updates)
  - Game start (state reset, bird position, recordRecentPlay)
  - Bird mechanics (jump, velocity)
  - Pipe mechanics (spawn, positioning, structure, gap)
  - Update logic (gravity, velocity, pipe movement, cleanup)
  - Scoring (passing pipes)
  - Collision detection (ground, ceiling, top pipe, bottom pipe, gap passage)
  - Game over (state, best score update, overlay)
  - Input handling (start, jump, restart)
  - Audio (initialization, disabled/null handling)
  - Drawing (no throw, canvas methods called)
  - Button events (start, play, theme, sound)

#### Pong (`games/pong/game.test.js`)
- **Tests**: 66 tests
- **Coverage Areas**:
  - Initialization and defaults
  - Difficulty settings (easy/medium/hard)
  - Canvas setup
  - Theme management
  - Sound management
  - Game start (state, paddles, ball positioning, recordRecentPlay)
  - Ball reset (center positioning, random direction)
  - Player paddle control (keyboard up/down, mouse, touch, bounds)
  - AI paddle control (follows ball, stays in bounds)
  - Ball movement (speed, wall bouncing)
  - Paddle collision (player paddle, AI paddle, speed increase)
  - Scoring (player scores, AI scores, display update, ball reset)
  - Win condition (player wins at 11, AI wins at 11)
  - Game over (state, overlay, win/lose messages)
  - Update logic (not running when paused, all update methods called)
  - Audio handling
  - Drawing (no throw, canvas methods)
  - Difficulty selection (localStorage save)
  - Button events (start, play, theme, sound)
  - Keyboard events (ArrowUp, ArrowDown, W, S, keyup reset, Space start)

#### Wordle (`games/wordle/game.test.js`)
- **Tests**: 64 tests
- **Coverage Areas**:
  - Word list (exported, has words, most are 5 letters, lowercase)
  - Initialization (defaults, random target word, theme/wins/streak loading)
  - Board creation (6 rows, 5 tiles per row, data attributes)
  - Theme management
  - Letter input (addLetter, increment col, filled class, max 5 letters)
  - Letter deletion (remove letter, decrement col, remove class, min 0)
  - Input handling (A-Z letters, BACKSPACE, ENTER, game over blocking)
  - Keyboard input (Enter, Backspace, letters, uppercase, game over blocking)
  - Guess submission (incomplete guess shake, invalid word shake, valid guess adds to array)
  - Get current guess (full, partial)
  - Tile reveal logic (correct letters, valid guess processing, key state updates)
  - Key state updates (update key, no downgrade from correct, upgrade from present)
  - Win condition (gameOver, wins increment, streak increment, save stats, show message, recordRecentPlay)
  - Loss condition (gameOver, streak reset, wins unchanged, save stats, show message, target word display)
  - New game (reset state, reset guesses, reset keyStates, new target word, recreate board, reset keyboard, hide message, recordRecentPlay)
  - Stats display (wins, streak)
  - Save stats (localStorage)
  - Get tile (correct tile by row/col)
  - Shake row (add class, remove after timeout)
  - Button events (play again, new game, theme toggle)
  - Virtual keyboard (letter click, ENTER click, BACKSPACE click)
  - Full game flow (win on first try, lose after 6 wrong guesses)

### Additional Test Updates
- Updated `hub.test.js` - Fixed `FooterStatsManager` test to expect '3/10' instead of '3/8' due to game count increase

### Files Created
- `games/flappy/game.test.js` (65 tests)
- `games/pong/game.test.js` (66 tests)
- `games/wordle/game.test.js` (64 tests)

### Files Modified
- `hub.test.js` - Updated game count assertion from /8 to /10

### Issues Found
None - all tests pass successfully.

## Status: Testing Complete

---

## Code Review Summary

### Verdict: APPROVED ✅

### Review Date: 2025-12-11

### Files Reviewed
- 9 new files created (3 games × 3 files each)
- 2 files modified (`hub.js`, `index.html`)
- 3 test files created (195 new tests)

### Code Quality Assessment

**Strengths:**

1. **Clean Architecture** - All 3 games follow established patterns:
   - Proper class structure (`FlappyBird`, `Pong`, `Wordle`)
   - CommonJS exports for testing (`module.exports`)
   - DOMContentLoaded initialization pattern
   - Consistent localStorage key naming

2. **Game Implementation Quality**
   - **Flappy Bird**: Canvas-based with gravity physics, collision detection, pipe spawning, scaling system
   - **Pong**: AI opponent with 3 difficulty levels, paddle collision physics, ball spin mechanics
   - **Wordle**: Proper two-pass letter matching (correct/present), keyboard state management, streak tracking

3. **Common Features Implemented**
   - Theme toggle (dark/light mode) ✅
   - Sound toggle with Web Audio API ✅
   - Stats persistence in localStorage ✅
   - Recent play tracking (`recordRecentPlay()`) ✅
   - Responsive design with canvas scaling ✅
   - Accessibility (aria-labels) ✅

4. **Hub Integration**
   - Games registered in `RecentGamesManager.games`
   - Games registered in `TouchInteractionManager.gameInfo`
   - `FooterStatsManager` updated from /8 to /10 games
   - Game cards added with "New" badges

5. **Test Coverage**
   - 195 new tests (Flappy: 65, Pong: 66, Wordle: 64)
   - 816/816 tests passing (100%)
   - Comprehensive coverage of all game mechanics

### Security Review
- No vulnerabilities identified
- localStorage usage appropriate (scores/preferences only)
- No user-controlled content rendering

### What's Good
- Canvas scaling for responsive design
- Web Audio API for sound (no external files)
- Proper `requestAnimationFrame` game loop
- Clean collision detection algorithms
- ~500 word Wordle word list

### Issues Found
None - all acceptance criteria met.

REVIEW_APPROVED

AGENT_TASK_COMPLETE
