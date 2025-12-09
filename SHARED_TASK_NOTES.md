# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - Union 시스템 & 아이템 가시성 개선 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 이번 iteration 완료 사항

### 1. Union 트리거 시스템 완성
- `checkForUnionPossibility()` 함수 추가 (game.js:1740-1757)
- 두 Union 무기가 모두 maxLevel이면 보물상자 획득 시 자동 합체
- UI에서 Union 준비 상태 시각적 표시:
  - **Union Ready**: 시안색 펄스 글로우 (RGB 0, 255, 255)
  - **Unioned**: 무지개 펄스 효과 + 'U' 레벨 표시
- Union 무기: Vandalier, Fuwalafuwaloo, Phieraggi

### 2. 경험치 젬 가시성 개선 (game.js:4621-4659)
- 젬 크기별 글로우 효과 (빨강 > 초록 > 파랑)
- 검은색 외곽선 추가
- 펄스 애니메이션 효과
- 추가 하이라이트로 3D 느낌

### 3. 보물상자 가시성 개선 (game.js:4661-4701)
- 골든 글로우 효과 (펄스)
- 검은색 외곽선 추가
- 하이라이트 & 그림자 추가로 입체감

## 기존 시스템 (유지)
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 15개 패시브 아이템
- 5개 스테이지 + Hyper Mode
- 웨이브 기반 적 스폰 (30분 생존)
- 플레이어/적/투사체 가시성 개선 (외곽선, 글로우)

## 다음 iteration 우선순위

1. **Area Effect 가시성 개선**
   - Whip, Holy Water, Garlic 등 영역 효과 개선
   - 현재 효과가 눈에 잘 안 띔

2. **게임 밸런스 조정**
   - 새 무기 데미지/쿨다운 밸런싱
   - Union 무기 밸런스 검토

3. **UI/UX 개선**
   - 무기 선택 화면에서 Union 가능 여부 표시
   - 진화/Union 조건 툴팁 추가

4. **사운드 효과 추가**
   - Union 완료 시 특별 효과음
   - 아이템 획득 효과음 다양화

5. **PWA 지원**
   - 오프라인 플레이 가능하도록
