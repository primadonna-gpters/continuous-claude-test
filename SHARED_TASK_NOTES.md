# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper 3개 게임 플레이 가능.

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
│   ├── snake/
│   └── minesweeper/
└── SHARED_TASK_NOTES.md
```

## 구현된 게임

### 2048
- 4x4 그리드, 타일 합치기 게임
- 화살표 키/WASD + 모바일 스와이프
- Undo 기능, 애니메이션 + 사운드

### Snake
- 20x20 그리드, 클래식 스네이크 게임
- 화살표 키/WASD + 모바일 스와이프/버튼
- 일시정지, 속도 증가, 사운드

### Minesweeper
- 3단계 난이도 (Easy/Medium/Hard)
- 클릭: 칸 열기, 우클릭/롱프레스: 깃발
- 타이머, 최고 기록 저장 (난이도별)
- 첫 클릭 안전 보장 (지뢰 없음)

## 공통 기능
- 다크 모드 (테마 공유: game-hub-theme)
- 사운드 on/off 토글
- 반응형 디자인 + 모바일 지원
- localStorage로 설정/점수 저장

## 다음 iteration에서 고려할 개선사항
1. **새 게임 추가** - Tetris, Flappy Bird, Breakout 등
2. **PWA 지원** - 오프라인 플레이
3. **통계 페이지** - 전체 게임 통계 대시보드
