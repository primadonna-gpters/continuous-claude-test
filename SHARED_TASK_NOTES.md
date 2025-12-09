# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - 가시성 개선 완료! (외곽선, 글로우 효과 추가)**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 가시성 개선 (이번 iteration)

### 1. 플레이어 가시성 향상
- 파란색 펄스 글로우 효과 추가 (플레이어 위치 쉽게 파악)
- 검은색 픽셀 외곽선 추가 (배경과 명확히 구분)
- 더 밝은 색상 사용 (파란색 #5588cc, 피부톤 #ffddaa)
- 방향 표시 화살표 추가 (노란색 화살표로 이동 방향 표시)
- 눈에 흰색 배경 + 검은 동공으로 표정 개선

### 2. 적 가시성 향상
- 모든 적에 그림자 효과 추가 (깊이감)
- 검은색 픽셀 외곽선 추가 (모든 적 유형)
- 더 밝고 선명한 색상으로 변경:
  - Bat: #55aa55 (밝은 녹색)
  - Skeleton: #eeeeee (밝은 흰색)
  - Ghost: 글로우 효과 + 85% 불투명도
  - Demon: #cc4444 (밝은 빨강) + 노란 눈
  - Wraith: 보라색 글로우 효과
  - Reaper: 밝은 빨간 눈 + 은색 낫
  - Zombie: #aa66cc (밝은 보라) + #88cc88 (밝은 초록)
- 보스에 타입별 글로우 효과 추가

### 3. 투사체 가시성 향상
- 모든 투사체에 글로우 효과 추가
- 검은색 외곽선 추가
- 트레일(잔상) 효과 개선
- 하이라이트 추가로 3D 느낌
- 개별 무기별 이펙트:
  - Axe: 주황색 글로우
  - Fireball: 3중 그라데이션 글로우
  - Knife: 트레일 + 은색 날
  - Cross: 성스러운 노란 글로우
  - Runetracer: 마법 파란 글로우 + 외곽선 stroke
  - Phiera/Eight: 트레일 + 흰색 팁
  - Phieraggi: 강력한 글로우 + 이중 트레일

### 4. 새 헬퍼 함수 추가 (game.js:4904-4954)
- `drawPixelRectOutline()`: 외곽선이 있는 픽셀 사각형
- `drawGlow()`: 방사형 글로우 효과
- `drawCharacterOutline()`: 캐릭터 실루엣 외곽선

## 기존 시스템 (유지)
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 15개 패시브 아이템
- 5개 스테이지 + Hyper Mode
- 웨이브 기반 적 스폰 (30분 생존)

## 다음 iteration 우선순위
1. **Union 트리거 로직**
   - 보물상자 획득 시 자동 Union 합체
   - checkForUnionPossibility() 함수 구현

2. **경험치 젬/아이템 가시성 개선**
   - 현재 작업과 동일하게 외곽선/글로우 추가

3. **Area Effect 가시성 개선**
   - Whip, Holy Water, Garlic 등 영역 효과 개선

4. **게임 밸런스 조정**
   - 새 무기 데미지/쿨다운 밸런싱

5. **PWA 지원**
