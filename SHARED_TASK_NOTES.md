# Game Hub - Task Notes

## Current Status
멀티 게임 허브 구조로 리팩토링 완료. 2048과 Snake 게임 플레이 가능.

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 프로젝트 구조
```
├── index.html          # Game Hub 메인 페이지
├── style.css           # Hub 스타일
├── hub.js              # Hub 테마 관리
├── games/
│   ├── 2048/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── game.js
│   └── snake/
│       ├── index.html
│       ├── style.css
│       └── game.js
└── SHARED_TASK_NOTES.md
```

## 구현된 게임

### 2048
- 4x4 그리드, 타일 합치기 게임
- 화살표 키/WASD + 모바일 스와이프
- 점수 시스템 (localStorage)
- Undo 기능 (1회)
- 타일 이동 애니메이션 + 사운드

### Snake
- 20x20 그리드, 클래식 스네이크 게임
- 화살표 키/WASD + 모바일 스와이프/버튼
- 일시정지 (Space 키)
- 속도 점진 증가 (50점마다)
- 사운드 효과 (먹기, 게임오버)

## 공통 기능
- 다크 모드 (테마 공유: game-hub-theme)
- 사운드 on/off 토글
- 반응형 디자인
- 모바일 지원

## 다음 iteration에서 고려할 개선사항
1. **새 게임 추가** - Tetris, Minesweeper, Flappy Bird 등
2. **PWA 지원** - 오프라인 플레이
3. **통계 페이지** - 전체 게임 통계 대시보드
4. **리더보드** - 각 게임별 순위표 (로컬)
