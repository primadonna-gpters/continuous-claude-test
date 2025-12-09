# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - 뱀파이어 서바이벌 핵심 시스템 구현 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 이번 iteration 업데이트

### 1. 아케인(Arcana) 시스템 (NEW!)
뱀파이어 서바이벌의 핵심 게임 모디파이어:
- 게임 시작 전 3개의 아케인 중 1개 선택
- **12가지 아케인:**
  - I - Sarabande of Healing: +50% 힐링
  - II - Twilight Requiem: 투사체 폭발
  - III - Tragic Princess: 이동 중 +50% 데미지
  - IV - Slash: 모든 무기 +3 관통
  - V - Chaos Malachite: +100% 투사체 속도
  - VI - Divine Bloodline: 방어력 → 데미지
  - VII - Iron Blue Will: 피격 시 데미지 버프 (5중첩)
  - VIII - Mad Groove: 2분마다 모든 젬/상자 흡수
  - IX - Silver Wind: 이속/공속/행운 증가
  - X - Beginning: +3 투사체, -30% 데미지
  - XI - Waltz of Pearls: 추가 바운스
  - XII - Out of Bounds: 만료 무기 폭발
- 아케인 선택 UI (캐릭터 선택 후)
- 게임 내 아케인 표시 + 타이머

### 2. 보스 체력바 UI (NEW!)
- 화면 상단 중앙에 보스 체력바
- 펄스 효과 + 그라데이션
- 보스 이름 및 체력 % 표시

### 3. 개선된 포즈 메뉴 (NEW!)
- 현재 장비 상세 표시 (무기/패시브/아케인)
- 진화 가능 무기: 금색 테두리
- 진화된 무기: 보라색 테두리
- 맥스 레벨 표시

## 기존 시스템 (유지)
- 8개 캐릭터
- 12개 무기 + 12개 진화 무기
- 15개 패시브 아이템
- 웨이브 기반 적 스폰 (30분 생존)
- 무기 진화: Lv8 + 패시브 + 보물상자
- 미니맵/킬 카운터/코인 시스템
- 레트로 UI (Press Start 2P 폰트)

## 다음 iteration 우선순위
1. **Union 진화 시스템**
   - 두 무기 합체 (예: Peachone + Ebony Wings = Vandalier)
   - 데이터 구조 추가됨 (UNION_WEAPONS)
   - 게임플레이 로직 구현 필요

2. **스테이지 선택**
   - 다양한 스테이지 (초원, 도서관, 묘지)
   - 스테이지별 특수 효과

3. **언락 시스템**
   - 조건부 캐릭터/무기 해금
   - 업적/도전과제

4. **PWA 지원**
