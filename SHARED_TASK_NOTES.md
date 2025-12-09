# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**PWA 지원 추가 완료! 오프라인에서도 게임 플레이 가능.**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 최근 개선 사항 (현재 iteration)

### 사운드 시스템 개선
- `evolution`: 무기 진화 전용 사운드 (상승하는 팡파레 - A major chord)
- `union`: Union 합체 전용 사운드 (더 극적인 팡파레 - E to E6)
- `chest`: 보물상자 획득 사운드 (반짝이는 트레저 사운드 - C major arpeggio)
- `victory`: 승리 전용 사운드 (장대한 팡파레 - C to C7)

### 시각 효과 개선
- **Pentagram**: 단순 원 → 실제 오망성 + 확장 링 + 스파클 파티클 + 화면 플래시
- **Song of Mana**: 단순 빔 → 글로우 그래디언트 + 음표 파티클 + 에지 스파클 라인
- **Bible (King Bible)**: 단순 책 → 홀리 글로우 + 십자가 장식 + 회전하는 스파클 오브잇
- **Cross**: 단순 십자가 → 맥동하는 오라 + 트레일 파티클 + 보석 악센트

## 기존 시스템 (유지)
- Pixel Survivor 게임 밸런스 조정 완료
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터, 15개 패시브 아이템
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 5개 스테이지 + Hyper Mode
- PWA 오프라인 지원

## 다음 iteration 우선순위

1. **추가 콘텐츠**
   - 새로운 캐릭터 또는 무기 추가
   - 업적 시스템 (Achievement System)

2. **추가 시각 효과**
   - 다른 무기들 (Runetracer, Lightning Ring 등) 효과 강화
   - 피격/대미지 이펙트 개선

3. **기타 개선**
   - 게임 튜토리얼 추가
   - 통계 화면 (플레이 시간, 총 킬수 등)

4. **PWA 개선 (선택적)**
   - 앱 업데이트 알림 기능
   - 전문 디자인 아이콘으로 교체
