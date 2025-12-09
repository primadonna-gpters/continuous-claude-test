# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor가 뱀파이어 서바이벌과 동일한 시스템으로 대규모 업데이트 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 뱀파이어 서바이벌 클론 (대규모 업데이트)

### 캐릭터 선택 시스템 (8명)
| 캐릭터 | 시작 무기 | 특수 효과 |
|--------|----------|----------|
| Antonio | Whip | +10% 데미지, 레벨당 +1 HP |
| Imelda | Magic Wand | +10% 경험치 |
| Gennaro | Knife | +1 투사체 |
| Pasqualina | Runetracer | +10% 이동속도 |
| Poe | Garlic | -30% HP, +25% 픽업범위 |
| Arca | Fire Wand | -5% 쿨다운 |
| Porta | Lightning Ring | +30% 공격범위 |
| Dommario | King Bible | +40% 지속시간 |

### 무기 시스템 (12개, 6슬롯)
| 무기 | 설명 | 진화 | 필요 패시브 |
|------|------|------|------------|
| Whip 🔪 | 수평 관통 공격 | Bloody Tear 🩸 | Hollow Heart |
| Magic Wand 🪄 | 가장 가까운 적 타겟팅 | Holy Wand ✨ | Empty Tome |
| Knife 🗡️ | 이동 방향 빠른 발사 | Thousand Edge ⚔️ | Bracer |
| Axe 🪓 | 포물선 궤적 | Death Spiral 💀 | Candelabrador |
| Fire Wand 🔥 | 랜덤 적 화염구 | Hellfire ☄️ | Spinach |
| Santa Water 💧 | 데미지 존 생성 | La Borra 🌊 | Attractorb |
| King Bible 📖 | 플레이어 주위 회전 | Unholy Vespers 📕 | Spellbinder |
| Cross ✝️ | 부메랑 (돌아옴) | Heaven Sword 🗡️ | Clover |
| Garlic 🧄 | 주변 지속 데미지 | Soul Eater 👻 | Pummarola |
| Lightning Ring ⚡ | 랜덤 적 번개 | Thunder Loop 🌩️ | Duplicator |
| Runetracer 💠 | 화면 내 바운스 | NO FUTURE 💥 | Armor |
| Pentagram ⭐ | 화면 전체 공격 | Gorgeous Moon 🌙 | Crown |

### 패시브 아이템 (15개, 6슬롯)
Spinach, Armor, Hollow Heart, Pummarola, Empty Tome, Candelabrador, Bracer, Spellbinder, Duplicator, Wings, Attractorb, Clover, Crown, Stone Mask, Tiragisu

### 적 웨이브 시스템 (분 기반)
- 0~30초: Zombie
- 30초~1분: +Bat
- 1분~: +Skeleton, BOSS: Giant
- 2분~: +Ghost
- 3분~: BOSS: Necromancer
- 4분~: +Demon
- 5분~: BOSS: Vampire
- 10분~: +Reaper
- 15분~: BOSS: Death
- 25분~: BOSS: Red Death (즉사 공격)

### 게임 메카닉
- **승리 조건**: 30분 생존
- 무기 진화: 레벨 8 + 해당 패시브 + 보물상자
- 미니맵, 무기/패시브 슬롯 UI
- 월드 크기: 2000x2000, 카메라 추적

### UI 개선사항
- 캐릭터 선택 화면 (8캐릭터 그리드)
- 희귀도별 컬러 (common/uncommon/rare/legendary)
- 레벨업/타이틀 애니메이션
- 진화 가능 무기 골드 테두리

## 다음 iteration에서 고려할 개선사항
1. **Pixel Survivor 추가 콘텐츠**
   - 언락 시스템 (캐릭터/무기)
   - 아케인 (조합 진화)
   - 스테이지 선택
   - 실적 시스템
2. **새 게임 추가** - Flappy Bird, Pong, Sudoku 등
3. **PWA 지원** - 오프라인 플레이
4. **통계 페이지** - 전체 게임 통계 대시보드
