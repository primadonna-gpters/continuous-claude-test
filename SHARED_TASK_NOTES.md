# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - 게임 밸런스 대폭 조정 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 이번 iteration 작업 내용

### 게임 밸런스 조정

#### Union 무기 너프
| 무기 | 변경 전 | 변경 후 |
|-----|--------|--------|
| Vandalier | dmg 25, cd 2.0, amount 6 | dmg 18, cd 2.5, amount 4 |
| Phieraggi | dmg 20, cd 0.2, amount 8 | dmg 12, cd 0.25, amount 6 |
| Fuwalafuwaloo | dmg 30, cd 0.8, crit 30% | dmg 22, cd 1.0, crit 20% |

#### 진화 무기 밸런스 조정
- Bloody Tear: dmg 1.5x → 1.4x, heal 2 → 1
- Thousand Edge: dmg 1.0x → 0.9x, amount +3 → +2
- Heaven Sword: dmg 2.0x → 1.6x, area 1.5x → 1.3x
- Hellfire: dmg 1.5x → 1.35x
- Thunder Loop: dmg 1.3x → 1.2x, chains 3 → 2

#### 웨이브 난이도 곡선 완화
- 중간 웨이브 추가 (150초, 420초, 540초, 720초, 840초, 1020초, 1350초, 1650초)
- spawnRate 곡선을 더 점진적으로 변경 (기존 0.2~0.15 → 0.25~0.35)
- 적 count 증가 속도 완화

#### 적 스탯 밸런싱
- Demon: health 3 → 2.5, damage 2.0 → 1.6
- Reaper: health 4 → 3.5, damage 2.5 → 2.0
- Death Boss: health 200 → 150, damage 10 → 6
- Red Death: health 500 → 400, damage 999 → 15

## 기존 시스템 (유지)
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터, 15개 패시브 아이템
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 5개 스테이지 + Hyper Mode
- 모든 시각 효과 (Area effect 글로우/외곽선, 투사체 효과 등)

## 다음 iteration 우선순위

1. **PWA 지원**
   - Service Worker 추가
   - 오프라인 플레이 가능하게

2. **사운드 개선**
   - Union/Evolution 시 전용 사운드 효과
   - 보물상자 획득 사운드 개선

3. **추가 시각 효과**
   - Pentagram, Song of Mana 등 나머지 효과들도 개선 검토
   - Bible, Cross 등 투사체 효과 강화

4. **추가 콘텐츠**
   - 새로운 캐릭터 또는 무기 추가 고려
   - 업적 시스템 검토
