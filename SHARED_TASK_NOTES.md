# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**PWA 지원 추가 완료! 오프라인에서도 게임 플레이 가능.**
**업적 시스템 추가 완료! 30개 업적 달성 가능.**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 최근 개선 사항 (현재 iteration)

### 무기별 시각 효과 대폭 개선
- **Fire Wand (fireball)**
  - 화염 트레일 파티클 (위로 상승하는 불꽃)
  - 깜빡이는 불꽃 글로우 효과
  - 물방울 모양의 불꽃 형태 (진행 방향으로 회전)
  - 3단계 불꽃 레이어 (외부/내부/코어)

- **Magic Wand (magicWand)**
  - 맥동하는 보라색 마법 오라
  - 3개의 공전하는 스파클
  - 마법 트레일 파티클 (별 모양)
  - 글로우 효과와 하이라이트

- **Knife**
  - 금속 모션 블러 트레일
  - 그라데이션 잔상 효과
  - 날카로운 엣지 하이라이트
  - 손잡이 디테일 추가

- **Axe**
  - 회전 잔상 (3단계 애프터이미지)
  - 속도 기반 글로우 강도
  - 금속 엣지 샤인 효과
  - 회전 궤적 파티클

### 새로운 파티클 타입
- `fire`: 화염 형태 파티클 (위로 상승)
- `magic`: 별 모양 마법 스파클
- `blade`: 금속 슬래시 트레일
- `axeTrail`: 도끼 잔상 이펙트

## 기존 시스템 (유지)
- 업적 시스템 (30개)
- 사운드 시스템: evolution, union, chest, victory 전용 사운드
- 시각 효과: Pentagram, Song of Mana, Bible, Cross, Runetracer, Lightning Ring 이펙트
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터, 15개 패시브 아이템
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 5개 스테이지 + Hyper Mode
- PWA 오프라인 지원
- 파티클 시스템 + 화면 흔들림 효과

## 다음 iteration 우선순위

1. **추가 무기 효과 개선**
   - Whip, Garlic 등 다른 무기 이펙트 강화
   - 진화 무기 전용 이펙트 추가

2. **추가 콘텐츠**
   - 새로운 캐릭터 또는 무기 추가
   - 숨겨진 업적 (Hidden achievements)

3. **기타 개선**
   - 게임 튜토리얼 추가
   - 통계 화면 (플레이 시간, 총 킬수 등)
   - 업적 달성 보상 시스템
