# Implementation Plan

> Session: 20251210-175543-31102-404c

## Overview
기존 Game Hub의 페이지들(메인 허브 페이지와 각 게임 페이지)에 3D 효과와 애니메이션을 적용합니다. `games/3d-showcase/` 폴더는 제거합니다.

## Current State Analysis

### 이미 구현된 기능 (유지/확장)
- **Hub 페이지**: 3D Tilt Effect (`TiltEffectManager`), scroll-based fade-in, gradient background animation, badge shine animation
- **게임 카드**: perspective 3D, hover shine effect, icon float animation
- **공통 CSS**: `common.css`에 glassmorphism, title glow, fade-in 애니메이션 존재

### 적용 대상 페이지
1. `index.html` - 메인 허브 페이지 (이미 상당부분 적용됨)
2. `games/2048/index.html` - 2048 게임
3. `games/snake/index.html` - Snake 게임
4. `games/minesweeper/index.html` - Minesweeper 게임
5. `games/tetris/index.html` - Tetris 게임
6. `games/breakout/index.html` - Breakout 게임
7. `games/memory/index.html` - Memory 게임
8. `games/survivor/index.html` - Pixel Survivor 게임

## Steps

### 1. [x] 3D Showcase 폴더 제거 ✅
   - Files: `games/3d-showcase/` (전체 삭제)
   - Criteria: 폴더가 완전히 제거됨

### 2. [x] 메인 허브 페이지에서 3D Showcase 링크 제거 ✅
   - Files: `index.html`
   - Criteria: 3D Showcase 게임 카드가 제거됨

### 3. [x] 메인 허브 페이지 3D/애니메이션 강화 ✅
   - Files: `style.css`, `hub.js`
   - Tasks:
     - 헤더에 parallax 스크롤 효과 추가
     - 통계 카드에 3D hover 효과 추가 (tilt effect 확장)
     - 최근 플레이 섹션에 애니메이션 추가
   - Criteria: 모든 인터랙티브 요소에 3D 효과 적용

### 4. [x] 공통 3D 애니메이션 컴포넌트 추가 ✅
   - Files: `common.css`, `common.js`
   - Tasks:
     - 3D 페이지 전환 효과 클래스 추가
     - 게임 컨테이너에 적용할 수 있는 3D transform 효과
     - 버튼/UI 요소 hover 시 3D lift 효과
     - 스코어 업데이트 시 pulse/scale 애니메이션
   - Criteria: 모든 게임 페이지에서 import하여 사용 가능
   - **Added**: `GameAnimations` class in `common.js` with methods for pulseScore, celebrateWin, shakeOnLose, flash, pageEnter, createTiltEffect

### 5. [x] 각 게임 페이지에 3D/애니메이션 적용 ✅
   - Files: 각 게임의 `style.css` 및 필요시 `game.js`

   #### 5.1 2048 게임 ✅
   - 타일 등장 시 3D flip/pop 애니메이션 (appear3d, pop3d)
   - 타일 합병 시 3D pulse 효과
   - 게임 메시지 3D 전환 효과
   - 버튼 3D lift 효과

   #### 5.2 Snake 게임 ✅
   - 게임 컨테이너 3D perspective 추가
   - 버튼 3D lift/shine 효과
   - 게임 메시지 3D 전환 효과

   #### 5.3 Minesweeper 게임 ✅
   - 셀 hover 시 3D scale/translate 효과
   - 셀 press 피드백 애니메이션
   - 버튼 및 메시지 3D 효과

   #### 5.4 Tetris 게임 ✅
   - 버튼 3D lift 효과
   - 게임 메시지 3D 전환 효과

   #### 5.5 Breakout 게임 ✅
   - 버튼 3D lift/shine 효과
   - 게임 메시지 3D 전환 효과

   #### 5.6 Memory 게임 ✅
   - 기존 3D 카드 flip 유지
   - 버튼 3D lift 효과 추가
   - 게임 메시지 3D 전환 효과

   #### 5.7 Pixel Survivor 게임 ✅
   - 게임 메시지 3D 전환 효과
   - UI 요소에 backdrop blur 강화

   - Criteria: 각 게임의 특성에 맞는 3D/애니메이션 적용, 게임플레이에 방해되지 않을 것

### 6. [x] 접근성 및 성능 고려 ✅
   - Files: `common.css`, 각 게임 CSS
   - Tasks:
     - `prefers-reduced-motion` 미디어 쿼리로 모든 애니메이션 비활성화 옵션
     - 모바일에서는 복잡한 3D 효과 간소화
   - Criteria: 접근성 테스트 통과, 성능 저하 없음
   - **Implemented**: All games now have `@media (prefers-reduced-motion: reduce)` blocks

### 7. [ ] 테스트 및 검증 (Tester 에이전트 담당)
   - Criteria:
     - 모든 페이지가 정상 로드됨
     - 애니메이션이 부드럽게 동작
     - 다크 모드에서도 정상 동작
     - 모바일에서 정상 동작

## Notes for Developer

### 기술적 접근 방식
- **순수 CSS 3D Transforms 사용**: 외부 라이브러리 없이 CSS `transform`, `perspective`, `rotateX/Y/Z`, `translateZ` 활용
- **JavaScript 인터랙션**: 마우스/터치 이벤트 기반 동적 효과
- **점진적 향상**: 기본 기능은 유지하면서 애니메이션은 추가 레이어로

### 우선순위
1. Hub 페이지 개선 (사용자가 첫 번째로 보는 페이지)
2. 자주 플레이되는 게임 (2048, Tetris, Memory)
3. 나머지 게임들

### 주의사항
- 게임플레이에 방해되는 과도한 애니메이션 피하기
- 기존에 동작하는 기능 손상시키지 않기
- `reduced-motion` 설정 존중
- 모바일 터치 디바이스에서는 3D tilt 효과 비활성화 (기존 구현 참고)

### 참고할 기존 코드
- `hub.js`의 `TiltEffectManager` - 3D tilt 효과 구현 예시
- `style.css`의 `.game-card` - perspective, transform-style: preserve-3d 사용법
- `common.css`의 `.btn-enhanced` - 버튼 hover 효과

## Status: Implementation Complete ✅

### Commits Made:
1. `🧑‍💻 [developer] Remove 3D Showcase game` - Deleted games/3d-showcase/ folder and removed link from hub
2. `🧑‍💻 [developer] Enhance main hub page 3D/animations` - Added parallax, stat card effects, recent games animations
3. `🧑‍💻 [developer] Add common 3D animation components` - Created reusable animation classes and GameAnimations utility
4. `🧑‍💻 [developer] Apply 3D/animations to all game pages` - Enhanced all 7 game pages with 3D effects

### Implementation Summary:
- **Hub Page**: Parallax scroll effect, enhanced stat cards with 3D hover, slide-in animations for recent games
- **Common Components**: GameAnimations class with pulseScore, celebrateWin, shakeOnLose, flash, pageEnter, createTiltEffect
- **All Games**: 3D button effects, message appear animations, container perspective
- **Accessibility**: All animations respect `prefers-reduced-motion` preference
- **Mobile**: Simplified 3D effects on touch devices

### Notes for Tester:
- Test all game pages for smooth animations
- Verify dark mode compatibility
- Test with `prefers-reduced-motion` enabled (system accessibility setting)
- Check mobile responsiveness
- Ensure gameplay is not impacted by animations
