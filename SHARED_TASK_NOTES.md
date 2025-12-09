# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor 대규모 업데이트 완료** - 뱀파이어 서바이벌 핵심 시스템 전체 구현.

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 뱀파이어 서바이벌 시스템

### 구현된 핵심 시스템

#### 1. 무기 시스템 (10종 + 진화 무기 10종)
**기본 무기:**
| 무기 | 설명 | 진화 조건 | 진화 형태 |
|------|------|----------|----------|
| Whip | 수평 공격 + 넉백 | Hollow Heart | Bloody Tear (흡혈) |
| Magic Wand | 가장 가까운 적 조준 | Empty Tome | Holy Wand (무쿨) |
| Knife | 이동 방향 발사 | Bracer | Thousand Edge (관통) |
| Axe | 위로 던지고 낙하 | Candelabrador | Death Spiral (관통) |
| Cross | 부메랑 | Clover | Heaven Sword (크리티컬) |
| King Bible | 플레이어 주변 회전 | Spellbinder | Unholy Vespers (영구) |
| Garlic | 근접 데미지 | Pummarola | Soul Eater (흡혈) |
| Fire Wand | 랜덤 적 조준 | Spinach | Hellfire (폭발) |
| Lightning | 번개 | Duplicator | Thunder Loop (체인) |
| Santa Water | 지면 데미지 존 | Attractorb | La Borra (따라다님) |

#### 2. 패시브 아이템 (14종)
Spinach(데미지), Armor(방어), Hollow Heart(체력), Pummarola(회복), Empty Tome(쿨다운), Candelabrador(범위), Bracer(투사체속도), Spellbinder(지속시간), Duplicator(투사체수), Wings(이동속도), Attractorb(픽업범위), Clover(행운), Crown(경험치), Skull O'Maniac(저주)

#### 3. 경험치 젬 (3종)
- Blue(1XP), Green(3XP), Red(10XP)
- 최대 400개, 초과시 슈퍼젬 생성

#### 4. 보스 & 보물상자
- 60초마다 보스 등장 (3종 로테이션)
- 보스 처치 → 보물상자 → 진화 또는 업그레이드

#### 5. 적 타입 (5종 + 보스 3종)
Zombie, Bat(빠름), Skeleton(강함), Ghost(넉백저항), Demon(최강)

#### 6. UI
- 화면 하단 인벤토리 (무기 6 + 패시브 6)
- 레벨업 시 4개 선택지 (숫자키 1-4)
- 보스 경고 (10초 전)

### 조작법
- WASD/화살표: 이동
- Space: 일시정지
- 1-4: 레벨업 선택

## 기타 게임 (기존)
- 2048, Snake, Minesweeper, Tetris, Breakout, Memory

## 공통 기능
- 다크 모드, 사운드 토글, 반응형, localStorage

## 다음 iteration 제안
1. **Union 무기** - 두 무기 합체
2. **캐릭터 선택** - 다른 시작 무기/스탯
3. **맵 시스템** - 다양한 스테이지
4. **아케인 카드** - 특수 능력
5. **새 게임** - Flappy Bird, Pong, Sudoku
