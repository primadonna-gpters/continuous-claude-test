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

### 1. [ ] 3D Showcase 폴더 제거
   - Files: `games/3d-showcase/` (전체 삭제)
   - Criteria: 폴더가 완전히 제거됨

### 2. [ ] 메인 허브 페이지에서 3D Showcase 링크 제거
   - Files: `index.html`
   - Criteria: 3D Showcase 게임 카드가 제거됨

### 3. [ ] 메인 허브 페이지 3D/애니메이션 강화
   - Files: `style.css`, `hub.js`
   - Tasks:
     - 헤더에 parallax 스크롤 효과 추가
     - 통계 카드에 3D hover 효과 추가 (tilt effect 확장)
     - 최근 플레이 섹션에 애니메이션 추가
   - Criteria: 모든 인터랙티브 요소에 3D 효과 적용

### 4. [ ] 공통 3D 애니메이션 컴포넌트 추가
   - Files: `common.css`, `common.js`
   - Tasks:
     - 3D 페이지 전환 효과 클래스 추가
     - 게임 컨테이너에 적용할 수 있는 3D transform 효과
     - 버튼/UI 요소 hover 시 3D lift 효과
     - 스코어 업데이트 시 pulse/scale 애니메이션
   - Criteria: 모든 게임 페이지에서 import하여 사용 가능

### 5. [ ] 각 게임 페이지에 3D/애니메이션 적용
   - Files: 각 게임의 `style.css` 및 필요시 `game.js`

   #### 5.1 2048 게임
   - 타일 이동 시 3D flip/slide 효과
   - 새 타일 등장 시 3D pop 애니메이션
   - 타일 합병 시 pulse 효과

   #### 5.2 Snake 게임
   - 게임 캔버스 컨테이너에 subtle tilt 효과
   - 점수 변경 시 애니메이션
   - 게임 오버/시작 메시지에 3D 전환

   #### 5.3 Minesweeper 게임
   - 셀 클릭 시 3D press 효과
   - 깃발 꽂기 시 flip 애니메이션
   - 승리/패배 시 보드 전체 효과

   #### 5.4 Tetris 게임
   - 블록 떨어질 때 subtle shadow 효과
   - 라인 클리어 시 flash/shake 애니메이션
   - 다음 블록 프리뷰에 rotation 효과

   #### 5.5 Breakout 게임
   - 벽돌 깨질 때 3D shatter 효과
   - 공 튕길 때 impact 효과
   - 패들에 tilt 반응 효과

   #### 5.6 Memory 게임
   - 카드 뒤집기 3D flip 효과 (이미 일부 존재할 가능성)
   - 매칭 성공 시 glow 효과
   - 게임 시작 시 카드 딜링 애니메이션

   #### 5.7 Pixel Survivor 게임 (복잡한 게임이므로 최소한의 적용)
   - UI 요소에만 3D 효과 적용
   - 레벨업/보스 등장 시 화면 효과

   - Criteria: 각 게임의 특성에 맞는 3D/애니메이션 적용, 게임플레이에 방해되지 않을 것

### 6. [ ] 접근성 및 성능 고려
   - Files: `common.css`, 각 게임 CSS
   - Tasks:
     - `prefers-reduced-motion` 미디어 쿼리로 모든 애니메이션 비활성화 옵션
     - `will-change` 속성 적절히 사용
     - 모바일에서는 복잡한 3D 효과 간소화
   - Criteria: 접근성 테스트 통과, 성능 저하 없음

### 7. [ ] 테스트 및 검증
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

## Status: Planning Complete

계획이 완료되었습니다. Developer 에이전트가 이 계획을 기반으로 구현을 진행할 수 있습니다.
