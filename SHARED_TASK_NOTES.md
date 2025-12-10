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

### Whip 무기 시각 효과 대폭 개선
- **동적 파동 애니메이션**: 채찍이 물결치는 곡선 형태로 렌더링
- **모션 블러 트레일**: 3단계 잔상으로 속도감 표현
- **채찍 끝 스파크 효과**: 휘두를 때 끝에서 불꽃 파티클 폭발
- **충격파 링 이펙트**: 적중 시 확장하는 충격파
- **그라데이션 색상**: 일반/진화 버전별 차별화된 색상 그라데이션
- **화면 흔들림**: 채찍 휘두를 때 미세한 화면 흔들림 추가
- **새 파티클 타입**: `whipCrack`, `whipShockwave`, `whipTrail`

### Garlic 무기 시각 효과 대폭 개선
- **다중 확장 링**: 3개의 확장하는 에너지 링 애니메이션
- **그라데이션 오라**: 중심부터 외곽으로 투명해지는 방사형 그라데이션
- **회전하는 포자 파티클**: 오라 주변을 공전하는 빛나는 포자들
- **맥동하는 점선 링**: 내부에서 펄스하는 대시 패턴 링
- **적 반발 웨이브**: 적 적중 시 해당 방향으로 파동 이펙트
- **힐링 파티클**: 회복 시 위로 올라가는 초록색 마법 파티클
- **새 파티클 타입**: `garlicSpore`, `garlicWave`

## 기존 시스템 (유지)
- 업적 시스템 (30개)
- 사운드 시스템: evolution, union, chest, victory 전용 사운드
- 시각 효과: Pentagram, Song of Mana, Bible, Cross, Runetracer, Lightning Ring 이펙트
- Fire Wand, Magic Wand, Knife, Axe 전용 시각 효과
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터, 15개 패시브 아이템
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 5개 스테이지 + Hyper Mode
- PWA 오프라인 지원
- 파티클 시스템 + 화면 흔들림 효과

## 다음 iteration 우선순위

1. **추가 무기 효과 개선**
   - Holy Water, King Bible 등 다른 무기 이펙트 강화
   - 진화 무기 전용 이펙트 추가 (Bloody Tear, Holy Wand 등)

2. **추가 콘텐츠**
   - 새로운 캐릭터 또는 무기 추가
   - 숨겨진 업적 (Hidden achievements)

3. **기타 개선**
   - 게임 튜토리얼 추가
   - 통계 화면 (플레이 시간, 총 킬수 등)
   - 업적 달성 보상 시스템
