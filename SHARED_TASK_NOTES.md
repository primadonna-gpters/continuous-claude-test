# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - 뱀파이어 서바이벌 핵심 시스템 대규모 업데이트 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 이번 iteration 업데이트

### 1. 스테이지 선택 시스템 (NEW!)
뱀파이어 서바이벌의 스테이지 시스템 구현:
- **5개 스테이지:**
  - Mad Forest (기본 언락): 기본 스테이지
  - Inlaid Library: +25% 이동속도, LV20 달성 시 언락
  - Dairy Plant: +25% 이속, +20% 골드, LV40 달성 시 언락
  - Gallo Tower: +10% 이속/행운, LV60 달성 시 언락
  - Cappella Magna: +20% 데미지, -20% 체력, 최종 스테이지
- 스테이지별 고유 modifier 적용
- Hyper Mode 언락 시스템 (25분 보스 처치)
- 스테이지 진행 상황 저장 (localStorage)

### 2. Union 진화 시스템 (NEW!)
두 무기가 합쳐져 하나가 되는 Union 시스템:
- **Vandalier**: Peachone + Ebony Wings (보물상자 획득 시 자동 합체)
- **Phieraggi**: Phiera Der Tuphello + Eight The Sparrow
- **Fuwalafuwaloo**: Vento Sacro + Bloody Tear
- Union 무기는 슬롯 1개로 합쳐짐 (무기 슬롯 확보)
- 포즈 메뉴에서 Union 가능 무기 표시 (분홍색 펄스)

### 3. 새 무기 추가 (NEW!)
- Peachone (🕊️): 원형 폭격
- Ebony Wings (🦇): 어둠 폭격
- Phiera Der Tuphello (🔫): 4방향 속사
- Eight The Sparrow (🐦): 4방향 속사 (반대)
- Song of Mana (🎵): 수직 데미지 존
- Vento Sacro (🌀): 부채꼴 공격

### 4. UI 개선
- 스테이지 선택 화면 (녹색 테마)
- 캐릭터 선택에 현재 스테이지 표시
- 게임오버/승리 화면에 스테이지/코인 정보
- Union 무기 표시 (분홍색 테두리)

## 기존 시스템 (유지)
- 아케인 시스템 (12종)
- 8개 캐릭터
- 12개 기본 무기 + 12개 진화 무기
- 15개 패시브 아이템
- 웨이브 기반 적 스폰 (30분 생존)
- 무기 진화: Lv8 + 패시브 + 보물상자
- 미니맵/킬 카운터/코인 시스템
- 보스 체력바 UI
- 레트로 UI (Press Start 2P 폰트)

## 다음 iteration 우선순위
1. **스테이지별 배경 그래픽**
   - STAGES에 bgPattern 정의됨 (trees, library, factory, tower, cathedral)
   - drawPixelGrid에서 스테이지별 배경 렌더링 필요

2. **Peachone/Ebony Wings 무기 동작 구현**
   - WEAPON_TYPES에 정의됨
   - updateWeapons에서 원형 폭격 로직 추가 필요

3. **Dairy Plant 트랩 이벤트**
   - hasTrapEvents 플래그 추가됨
   - 트랩 피자 터치 시 랜덤 이벤트 로직 필요

4. **언락 시스템 UI**
   - 새 캐릭터/무기 해금 알림
   - 메인 화면에서 언락 가능 항목 표시

5. **PWA 지원**
