# Implementation Plan

> Session: 20251210-171242-19228-579f

## Overview
Create an animated 3D showcase page for the Game Hub PWA. This page will feature interactive 3D CSS animations demonstrating rotating cubes, card flips, floating elements, and parallax effects. The page serves as both a visual demo and an "About" or showcase section for the hub.

## Project Context
- **Project Type**: Vanilla JS Game Hub PWA (no frameworks)
- **Tech Stack**: HTML5, CSS3 (keyframes, 3D transforms), JavaScript
- **Existing Patterns**:
  - Glassmorphism effects (`backdrop-filter: blur()`)
  - CSS 3D transforms (Memory game card flip: `transform-style: preserve-3d`, `rotateY()`)
  - Animated gradients (`gradientShift` keyframes)
  - Dark mode support via `.dark-mode` class
  - Responsive design with media queries

## Steps

### 1. [ ] Create Directory Structure
- Files: `games/3d-showcase/index.html`, `games/3d-showcase/style.css`, `games/3d-showcase/script.js`
- Criteria: Directory exists with three empty files

### 2. [ ] Build HTML Page Structure
- Files: `games/3d-showcase/index.html`
- Details:
  - Follow existing game page template (see `games/memory/index.html`)
  - Include `../../common.css` for shared animations
  - Add semantic sections for different 3D demos
  - Include back button to hub, theme toggle
  - Add container divs for: 3D cube, floating cards, parallax scene
- Criteria: Page loads and displays basic structure, links work

### 3. [ ] Implement CSS 3D Cube Animation
- Files: `games/3d-showcase/style.css`
- Details:
  - Create `.scene-3d` container with `perspective: 1000px`
  - Build 6-face cube using `transform-style: preserve-3d`
  - Apply continuous rotation animation via `@keyframes rotate3d`
  - Each face styled with glassmorphism effect
  - Support hover pause/speed change
- Criteria: 3D cube rotates smoothly on all axes

### 4. [ ] Implement Floating 3D Cards
- Files: `games/3d-showcase/style.css`
- Details:
  - Create card stack with `perspective` container
  - Apply `rotateX()` and `rotateY()` for tilt effect
  - Add floating animation with `translateY()` oscillation
  - Implement hover interaction that changes rotation
  - Use existing card-flip pattern from Memory game
- Criteria: Cards float and respond to hover with 3D tilt

### 5. [ ] Implement Parallax Scroll Effect
- Files: `games/3d-showcase/style.css`, `games/3d-showcase/script.js`
- Details:
  - Create layered elements with different `translateZ()` values
  - Use CSS `transform-style: preserve-3d` on parent
  - Add scroll listener to adjust `perspective-origin`
  - Multiple depth layers (foreground, midground, background)
- Criteria: Elements move at different speeds when scrolling

### 6. [ ] Add Interactive JavaScript Controls
- Files: `games/3d-showcase/script.js`
- Details:
  - Animation speed controls (slow, normal, fast)
  - Pause/play toggle for all animations
  - Mouse/touch tracking for interactive rotation
  - Theme toggle (dark mode) integration
  - Integrate with `common.js` ThemeManager pattern
- Criteria: All controls functional, state persists

### 7. [ ] Apply Dark Mode Styles
- Files: `games/3d-showcase/style.css`
- Details:
  - Override colors for `.dark-mode` body class
  - Adjust glassmorphism opacity for dark theme
  - Change animated gradient colors
  - Ensure contrast ratios meet accessibility
- Criteria: Dark mode fully styled and toggleable

### 8. [ ] Add Responsive Design
- Files: `games/3d-showcase/style.css`
- Details:
  - Reduce 3D element sizes on mobile
  - Stack sections vertically on narrow screens
  - Adjust perspective values for touch devices
  - Add touch event handlers for mobile interaction
  - Media queries at `768px` and `480px` breakpoints
- Criteria: Page usable on mobile devices

### 9. [ ] Add Hub Navigation Link
- Files: `index.html`
- Details:
  - Add new game card linking to 3D showcase
  - Use appropriate icon (e.g., "🎪" or "🎨")
  - Add "New" badge
- Criteria: 3D showcase accessible from hub

### 10. [ ] Add Accessibility Features
- Files: `games/3d-showcase/index.html`, `games/3d-showcase/style.css`
- Details:
  - Respect `prefers-reduced-motion` media query
  - Add ARIA labels to interactive elements
  - Ensure keyboard navigation works
  - Disable complex animations when reduced motion preferred
- Criteria: Page works with reduced motion preference

## File Structure
```
games/
└── 3d-showcase/
    ├── index.html     # Main page with 3D demo sections
    ├── style.css      # All 3D animations and styling
    └── script.js      # Interactivity and controls
```

## CSS 3D Techniques to Use
1. **Cube**: `transform-style: preserve-3d` + `rotateX/Y/Z`
2. **Cards**: `perspective` + `rotateY(180deg)` flip
3. **Float**: `@keyframes` with `translateY` oscillation
4. **Parallax**: `translateZ()` with `perspective` container
5. **Tilt**: Mouse tracking + `rotateX/Y` on hover

## Color Theme (Cyan/Teal for 3D showcase)
- Primary: `#00bcd4` (cyan)
- Secondary: `#26c6da`
- Background gradient: `#e0f7fa, #b2ebf2, #80deea, #e0f7fa`
- Dark mode: `#006064, #00838f, #00acc1`

## Notes for Developer
1. **No external dependencies** - Use only vanilla CSS3 and JS
2. **Follow existing patterns** - Reference `games/memory/` for structure
3. **Performance** - Use `will-change` and `transform` (GPU accelerated)
4. **Accessibility first** - Always respect `prefers-reduced-motion`
5. **Mobile touch** - Add touch event handlers for mobile interaction
6. **Theme integration** - Use existing `ThemeManager` from `common.js`

## Testing Checklist
- [ ] 3D cube renders and rotates
- [ ] Cards flip on click/tap
- [ ] Parallax effect works on scroll
- [ ] Controls affect animations
- [ ] Dark mode fully styled
- [ ] Mobile responsive
- [ ] Reduced motion respected
- [ ] No console errors
- [ ] Links work (hub ↔ showcase)

---

## Status: Planning Complete

Plan created by Planner Agent. Ready for implementation by Developer Agent.
