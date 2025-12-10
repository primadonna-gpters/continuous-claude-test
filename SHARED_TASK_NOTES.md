# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 7개 게임 플레이 가능.
- **PWA 지원 완료**
- **업적 시스템 완료 (30개)**
- **Web UI Phase 1 완료** (글래스모피즘, 애니메이션, 배지)
- **Web UI Phase 2.2 완료** (통계 섹션)
- **Web UI Phase 2.3 완료** (최근 플레이 섹션)

---

## 완료된 작업

### Phase 2.2: 통계 섹션 (완료)
- `index.html`: `.stats-section` 추가
- `style.css`: 통계 카드 스타일 + 다크모드 + 반응형
- `hub.js`: `StatsManager` 클래스 구현
  - 게임별 최고 점수 표시 (2048, Snake, Tetris, Breakout)
  - Memory, Survivor 특수 포맷 (moves, time)
  - localStorage에서 데이터 읽어 동적 렌더링

### Phase 2.3: 최근 플레이 섹션 (완료)
- `index.html`: `.recent-section` 추가
- `style.css`: 최근 플레이 카드 스타일 + 다크모드 + 반응형
- `hub.js`: `RecentGamesManager` 클래스 구현
  - `localStorage.getItem('recent-games')` 기반
  - 최대 3개 게임 표시
  - 기록 없으면 섹션 숨김

---

## 🎯 다음 작업: Phase 2.3 완성 + Phase 3

### Phase 2.3 추가 작업 (남은 작업)
각 게임에서 `recordRecentPlay()` 함수 호출 추가 필요:

```javascript
// 각 게임의 game.js에 추가
function recordRecentPlay(gameName) {
    const recent = JSON.parse(localStorage.getItem('recent-games') || '[]');
    const filtered = recent.filter(g => g !== gameName);
    filtered.unshift(gameName);
    localStorage.setItem('recent-games', JSON.stringify(filtered.slice(0, 5)));
}
```

**추가해야 할 게임 파일:**
- [ ] games/2048/game.js - `recordRecentPlay('2048')`
- [ ] games/snake/game.js - `recordRecentPlay('snake')`
- [ ] games/minesweeper/game.js - `recordRecentPlay('minesweeper')`
- [ ] games/tetris/game.js - `recordRecentPlay('tetris')`
- [ ] games/breakout/game.js - `recordRecentPlay('breakout')`
- [ ] games/memory/game.js - `recordRecentPlay('memory')`
- [ ] games/survivor/game.js - `recordRecentPlay('survivor')`

### Phase 3: 인터랙티브 요소
1. **마우스 효과**: 카드 호버 시 3D 틸트 효과
2. **사운드**: 버튼 클릭, 게임 시작 등 UI 사운드
3. **파티클 효과**: 업적 달성, 하이스코어 등

### Phase 4: 개별 게임 페이지 스타일 통일
- 게임별 배경 일관성
- 공통 헤더/푸터 스타일
- 다크모드 통일

---

## localStorage 키 정리 (참조용)

| 게임 | localStorage 키 | 값 형식 |
|------|----------------|---------|
| 2048 | `2048-best-score` | 숫자 (점수) |
| Snake | `snake-best-score` | 숫자 (점수) |
| Tetris | `tetris-best-score` | 숫자 (점수) |
| Breakout | `breakout-best-score` | 숫자 (점수) |
| Memory | `memory-best-easy`, `-medium`, `-hard` | 숫자 (이동 횟수) |
| Survivor | `survivor-best-time` | 숫자 (초) |
| Minesweeper | `minesweeper-best-beginner` 등 | 숫자 (초) |
| Recent Games | `recent-games` | JSON 배열 (게임명) |

---

## 기술적 고려사항

1. **성능**: CSS 애니메이션은 `transform`과 `opacity`만 사용 (GPU 가속)
2. **접근성**: `prefers-reduced-motion` 지원 필수
3. **호환성**: 모던 브라우저 대상 (Chrome, Firefox, Safari, Edge)
4. **PWA**: Service Worker 캐시 무효화 필요시 sw.js 수정
