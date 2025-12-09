# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.

**Pixel Survivor가 뱀파이어 서바이벌 스타일로 대폭 개선됨!**

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
│   ├── minesweeper/
│   ├── tetris/
│   ├── breakout/
│   ├── memory/
│   └── survivor/       # Pixel Survivor (뱀파이어 서바이벌 스타일)
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

### Tetris
- 10x20 그리드, 클래식 테트리스
- 화살표 키: 이동/회전, Space: 하드 드롭
- X/Z: 회전, C: 홀드 기능
- Next 피스 미리보기, Hold 기능
- 7-bag 랜덤화, 고스트 피스 표시
- 레벨업 시스템 (10줄마다), 사운드

### Breakout
- 10x5 벽돌 그리드, 클래식 벽돌 깨기 게임
- 화살표 키/WASD/마우스로 패들 이동
- Space/클릭으로 공 발사
- 레벨업 시스템 (모든 벽돌 파괴 시 다음 레벨)
- Lives 시스템 (3개), 사운드

### Memory
- 카드 짝 맞추기 게임
- 3단계 난이도 (Easy 4x3, Medium 4x4, Hard 6x4)
- 클릭으로 카드 뒤집기
- 이동 횟수, 타이머 표시
- 난이도별 최고 기록 저장, 사운드

### Pixel Survivor (뱀파이버 서바이벌 스타일)
- WASD/화살표 키 + 모바일 조이스틱으로 이동
- **8가지 무기**: Whip, Knife, Axe, Cross, Holy Water, Garlic, Lightning Ring, Magic Wand
- **12가지 패시브 아이템**: Spinach, Armor, Wings, Empty Tome, Bracer, Candelabrador, Clover, Pummarola, Attractorb, Duplicator, Crown, Hollow Heart
- **무기 진화 시스템**: 무기 레벨 8 + 특정 패시브 → 진화 무기 (보스 상자에서)
  - Whip + Empty Tome → Bloody Tear (흡혈)
  - Knife + Bracer → Thousand Edge (다중 투사체)
  - Axe + Candelabrador → Death Spiral (공전)
  - Cross + Clover → Heaven Sword
  - Holy Water + Attractorb → La Borra
  - Garlic + Pummarola → Soul Eater (흡혈)
  - Lightning + Duplicator → Thunder Loop
  - Magic Wand + Empty Tome → Holy Wand
- **6슬롯 제한**: 무기 6개, 패시브 6개 최대
- **5가지 일반 적**: Zombie, Bat, Skeleton, Ghost, Demon (시간에 따라 등장)
- **3가지 보스**: Giant, Werewolf, Vampire (매 분마다 스폰)
- **30분 사신(Reaper)**: 30분 생존 시 사신 출현, 처치하면 승리
- **보물 상자**: 보스 처치 시 드롭, 무기 진화 가능
- 레벨업 시 무기/패시브 선택 (최대 4개 옵션)
- 시간 경과에 따른 난이도 상승, 웨이브 시스템
- 최고 생존 시간 저장, 사운드

## 공통 기능
- 다크 모드 (테마 공유: game-hub-theme)
- 사운드 on/off 토글
- 반응형 디자인 + 모바일 지원
- localStorage로 설정/점수 저장

## 다음 iteration에서 고려할 개선사항
1. **Pixel Survivor 추가 개선**
   - 캐릭터 선택 (다른 시작 무기)
   - 더 많은 무기/패시브 추가
   - 맵 이벤트 시스템
2. **새 게임 추가** - Flappy Bird, Pong, Sudoku 등
3. **PWA 지원** - 오프라인 플레이
4. **통계 페이지** - 전체 게임 통계 대시보드
