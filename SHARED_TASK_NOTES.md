# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - 스테이지별 배경 그래픽 + 새 무기 동작 구현 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 이번 iteration 업데이트

### 1. 스테이지별 배경 그래픽 (NEW!)
각 스테이지에 고유한 배경 요소 추가:
- **Mad Forest**: 나무, 풀, 버섯 (어두운 숲)
- **Inlaid Library**: 책장, 책, 촛불, 타일 바닥
- **Dairy Plant**: 금속 바닥판, 파이프, 기어, 주의 줄무늬
- **Gallo Tower**: 돌벽돌, 횃불, 사슬, 거미줄
- **Cappella Magna**: 체크무늬 타일, 스테인드글라스 빛, 기둥, 촛대

### 2. 새 무기 동작 구현 (NEW!)
- **Peachone** (🕊️): 원형 영역에 성스러운 빛 폭격
- **Ebony Wings** (🦇): 원형 영역에 어둠 에너지 폭격
- **Phiera Der Tuphello** (🔫): 4방향(상하좌우) 속사
- **Eight The Sparrow** (🐦): 4방향(대각선) 속사
- **Song of Mana** (🎵): 수직 데미지 빔
- **Vento Sacro** (🌀): 부채꼴 슬래시 공격

### 3. Union 무기 동작 구현 (NEW!)
- **Vandalier** (🦅): Peachone + Ebony Wings 합체 → 대규모 폭격
- **Phieraggi** (🔫): Phiera + Eight 합체 → 8방향 관통 속사
- **Fuwalafuwaloo** (🌸): Vento Sacro + Bloody Tear 합체 → 360도 크리티컬 슬래시

### 4. 시각 효과 추가
- 새 무기들의 projectile/area effect 렌더링
- Union 무기 특별 이펙트 (글로우, 스파클)

## 기존 시스템 (유지)
- 아케인 시스템 (12종)
- 8개 캐릭터
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 15개 패시브 아이템
- 5개 스테이지 + Hyper Mode
- 웨이브 기반 적 스폰 (30분 생존)
- 무기 진화: Lv8 + 패시브 + 보물상자
- 미니맵/킬 카운터/코인 시스템
- 보스 체력바 UI
- 레트로 UI (Press Start 2P 폰트)

## 다음 iteration 우선순위
1. **Union 트리거 로직**
   - 현재 Union 무기는 수동으로 추가해야 함
   - 보물상자 획득 시 자동 Union 합체 로직 필요
   - checkForUnionPossibility() 함수 구현

2. **Dairy Plant 트랩 이벤트**
   - hasTrapEvents 플래그 사용
   - 트랩 피자 터치 시 랜덤 이벤트 로직

3. **언락 시스템 UI**
   - 새 캐릭터/무기 해금 알림
   - 메인 화면에서 언락 가능 항목 표시

4. **게임 밸런스 조정**
   - 새 무기 데미지/쿨다운 밸런싱
   - Union 무기 획득 조건 테스트

5. **PWA 지원**
