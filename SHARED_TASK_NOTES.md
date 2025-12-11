# Implementation Plan: Game Hub 개선

## Overview

Game Hub 프로젝트의 품질, 성능, 접근성, 유지보수성을 개선하기 위한 단계별 계획입니다.
현재 7개 게임(2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor)이 포함되어 있으며,
PWA, 다크모드, 3D 애니메이션이 이미 구현된 상태입니다.

---

## Current State Analysis

### Strengths (이미 잘 되어 있는 부분)
- PWA 지원 (Service Worker, manifest.json)
- 다크/라이트 모드 테마
- 접근성 고려 (prefers-reduced-motion 지원)
- 113개 테스트 통과 (hub.js, common.js 테스트)
- 3D/애니메이션 효과
- 반응형 디자인

### Areas for Improvement (개선 필요 영역)
1. **테스트 커버리지**: 개별 게임 코드(games/*/game.js)에 대한 테스트 없음
2. **코드 구조**: survivor/game.js가 8,363줄로 너무 큼
3. **성능 최적화**: Service Worker 캐싱 전략, 이미지/에셋 최적화
4. **접근성**: 키보드 내비게이션, ARIA 레이블 개선
5. **사용자 경험**: 게임 튜토리얼, 설정 저장, 다국어 지원

---

## Steps

### Phase 1: Code Quality & Testing

1. [ ] **Step 1: common.js/hub.js 테스트 보강**
   - Files: `common.js`, `hub.js`, `hub.test.js`, `animations.test.js`
   - Criteria: 테스트 커버리지 90% 이상 달성
   - Priority: High
   - Notes: 현재 테스트가 잘 되어 있으나 edge case 추가 가능

2. [ ] **Step 2: 게임별 기본 테스트 추가 - 2048**
   - Files: `games/2048/game.js`, `games/2048/game.test.js` (new)
   - Criteria: 게임 로직 핵심 함수 테스트, SoundManager 테스트
   - Priority: Medium
   - Notes: 2048은 비교적 간단한 로직으로 시작하기 좋음

3. [ ] **Step 3: 게임별 기본 테스트 추가 - Snake**
   - Files: `games/snake/game.js`, `games/snake/game.test.js` (new)
   - Criteria: 이동 로직, 충돌 감지, 점수 시스템 테스트
   - Priority: Medium

4. [ ] **Step 4: 게임별 기본 테스트 추가 - Tetris**
   - Files: `games/tetris/game.js`, `games/tetris/game.test.js` (new)
   - Criteria: 블록 회전, 라인 클리어, 게임오버 로직 테스트
   - Priority: Medium

### Phase 2: Code Organization & Refactoring

5. [ ] **Step 5: Pixel Survivor 코드 모듈화**
   - Files: `games/survivor/game.js` (8,363줄 → 분리)
   - New Files:
     - `games/survivor/modules/player.js`
     - `games/survivor/modules/weapons.js`
     - `games/survivor/modules/enemies.js`
     - `games/survivor/modules/items.js`
     - `games/survivor/modules/stages.js`
   - Criteria: 각 모듈 1,000줄 이하, import/export 사용
   - Priority: High
   - Notes: 가장 큰 파일이므로 유지보수성 향상 필요

6. [ ] **Step 6: 공통 게임 유틸리티 추출**
   - Files: `common.js`, 각 게임의 `game.js`
   - New File: `common-game.js`
   - Criteria: SoundManager, ThemeManager, ScoreManager 통합
   - Priority: Medium
   - Notes: 현재 각 게임에서 유사한 패턴이 반복됨

### Phase 3: Performance Optimization

7. [ ] **Step 7: Service Worker 캐싱 전략 개선**
   - Files: `sw.js`
   - Criteria:
     - stale-while-revalidate 전략 적용
     - 캐시 버전 자동 관리
     - 오프라인 폴백 페이지 개선
   - Priority: Medium

8. [ ] **Step 8: 이미지/에셋 최적화**
   - Files: `icons/*`, `manifest.json`
   - Criteria:
     - WebP 포맷 지원 추가
     - 적절한 이미지 크기 제공 (srcset)
     - 아이콘 파일 최적화
   - Priority: Low

### Phase 4: Accessibility & UX

9. [ ] **Step 9: 키보드 내비게이션 개선**
   - Files: `index.html`, `hub.js`, 각 게임 페이지
   - Criteria:
     - Tab 키로 모든 게임 카드 접근 가능
     - Enter 키로 게임 시작
     - Focus 스타일 명확하게 표시
   - Priority: Medium

10. [ ] **Step 10: ARIA 레이블 및 시맨틱 마크업 개선**
    - Files: `index.html`, 각 게임의 `index.html`
    - Criteria:
      - 모든 버튼에 적절한 aria-label
      - 게임 상태 변경 시 aria-live 영역 사용
      - 랜드마크 역할(role) 적용
    - Priority: Medium

### Phase 5: New Features (선택적)

11. [ ] **Step 11: 게임 설정 페이지 추가**
    - New Files:
      - `settings.html`
      - `settings.js`
      - `settings.css`
    - Criteria:
      - 전역 사운드 설정
      - 테마 설정
      - 저장 데이터 관리 (점수 초기화)
    - Priority: Low

12. [ ] **Step 12: 다국어 지원 (i18n)**
    - New Files:
      - `locales/ko.json`
      - `locales/en.json`
      - `i18n.js`
    - Criteria:
      - 한국어/영어 전환
      - 언어 설정 localStorage 저장
    - Priority: Low

---

## Notes for Developer

### 우선순위 작업 순서 (권장)
1. **Phase 1 - Step 2-4**: 게임별 테스트 추가가 가장 중요 (현재 게임 로직 테스트 없음)
2. **Phase 2 - Step 5**: Pixel Survivor 모듈화 (8,000줄 이상의 단일 파일은 유지보수 어려움)
3. **Phase 3 - Step 7**: PWA 성능 개선
4. 나머지는 시간이 허락하는 대로

### 기술적 고려사항
- ES6+ 모듈 시스템 사용 시 `type="module"` 필요
- 테스트는 jest-environment-jsdom 환경에서 실행
- Canvas API 테스트는 mocking 필요
- Service Worker 변경 시 CACHE_NAME 버전 업데이트 필수

### 코드 스타일 가이드
- 기존 패턴 따르기: class 기반, camelCase
- SoundManager, ThemeManager 등 싱글톤 패턴 유지
- localStorage 키 네이밍: `[game]-[setting]` 형식
- prefers-reduced-motion 항상 확인

### 테스트 실행
```bash
npm test                 # 전체 테스트
npm run test:watch      # 감시 모드
npm run test:coverage   # 커버리지 리포트
```

---

## Status: Ready for Implementation

이 계획은 Phase별로 독립적으로 진행 가능합니다.
가장 urgent한 작업은 테스트 커버리지 확대(Phase 1)와 코드 모듈화(Phase 2)입니다.

---

> Session: 20251211-104457-88577-24e4
> Last Updated: 2025-12-11
