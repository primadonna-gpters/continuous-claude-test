# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
Pixel Survivor가 뱀파이어 서바이벌 시스템으로 대폭 개선됨.

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
│   └── survivor/       # Pixel Survivor (Vampire Survivors clone)
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

### Pixel Survivor (Vampire Survivors Clone) - UPDATED
**뱀파이어 서바이벌과 동일한 시스템으로 대폭 개선됨**

#### 무기 시스템 (6개 슬롯)
| 무기 | 설명 | 진화 | 필요 패시브 |
|------|------|------|------------|
| Whip 🔪 | 수평 공격 | Bloody Tear 🩸 (적중 시 회복) | Hollow Heart |
| Magic Wand 🪄 | 가장 가까운 적 타겟팅 | Holy Wand ✨ (쿨다운 감소) | Empty Tome |
| Knife 🗡️ | 이동 방향으로 발사 | Thousand Edge ⚔️ (다중 발사체) | Bracer |
| Axe 🪓 | 포물선 궤적 | Death Spiral 💀 (궤도 회전) | Candelabrador |
| Fire Wand 🔥 | 화염구 발사 | Hellfire ☄️ (폭발 효과) | Spinach |
| Holy Water 💧 | 데미지 존 생성 | La Borra 🌊 (플레이어 따라다님) | Attractorb |

#### 패시브 아이템 시스템 (6개 슬롯)
| 패시브 | 효과 |
|--------|------|
| Hollow Heart ❤️ | +20% 최대 체력 |
| Empty Tome 📕 | -8% 쿨다운 |
| Bracer 🦾 | +10% 투사체 속도 |
| Candelabrador 🕯️ | +10% 공격 범위 |
| Spinach 🥬 | +10% 데미지 |
| Attractorb 🧲 | +50% 픽업 범위 |
| Clover 🍀 | +10% 행운 (보물상자 드롭률) |
| Pummarola 🍅 | +0.2 HP/초 재생 |
| Duplicator 📋 | +1 투사체 수 |

#### 진화 시스템
- 무기 레벨 8 (최대) + 해당 패시브 보유 시 보물상자에서 진화
- 진화 무기는 강력한 특수 효과 보유

#### 적 타입
- Zombie (기본): 표준 스탯
- Bat: 빠르지만 체력 낮음
- Skeleton: 느리지만 체력 높고 데미지 강함
- Ghost: 중간 스탯, 반투명
- Boss: 5분 후 등장, 매우 높은 스탯

#### 게임 메카닉
- 레벨업 시 무기/패시브 중 3-4개 선택지
- 보물상자: 적 처치 시 2% 확률 드롭 (Clover로 증가)
- 난이도: 30초마다 적 스탯 증가, 스폰 속도 증가
- 화면 하단에 무기/패시브 슬롯 UI 표시

## 공통 기능
- 다크 모드 (테마 공유: game-hub-theme)
- 사운드 on/off 토글
- 반응형 디자인 + 모바일 지원
- localStorage로 설정/점수 저장

## 다음 iteration에서 고려할 개선사항
1. **Pixel Survivor 추가 개선**
   - King Bible (회전 무기) 추가
   - Lightning Ring (연쇄 번개) 추가
   - 더 많은 적 타입 및 보스
   - 30분 생존 시 승리 조건
2. **새 게임 추가** - Flappy Bird, Pong, Sudoku 등
3. **PWA 지원** - 오프라인 플레이
4. **통계 페이지** - 전체 게임 통계 대시보드
