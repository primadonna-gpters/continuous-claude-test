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

### 업적 시스템 (Achievement System)
- 30개의 업적 정의 (7개 카테고리)
- **Combat**: First Blood, Slayer (100), Mass Extinction (500), Apocalypse (1000), Annihilator (3000)
- **Survival**: 5분, 10분, 20분, 30분 생존 업적
- **Evolution**: 첫 진화, 3개 진화, 6개 진화, Union 생성
- **Leveling**: 레벨 10, 25, 50, 100 달성
- **Collection**: 6무기, 6패시브, 상자 10개/25개
- **Stages**: 각 스테이지 클리어 업적 (5개)
- **Special**: Close Call (HP 10% 이하), Gold Hoarder (500/2000), Arcana User
- 업적 알림 토스트 UI
- 업적 목록 모달 (진행 상황 표시)
- localStorage 영구 저장
- 전용 업적 해금 사운드 효과

## 기존 시스템 (유지)
- 사운드 시스템: evolution, union, chest, victory 전용 사운드
- 시각 효과: Pentagram, Song of Mana, Bible, Cross 이펙트 강화
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
   - 숨겨진 업적 (Hidden achievements)

2. **추가 시각 효과**
   - 다른 무기들 (Runetracer, Lightning Ring 등) 효과 강화
   - 피격/대미지 이펙트 개선

3. **기타 개선**
   - 게임 튜토리얼 추가
   - 통계 화면 (플레이 시간, 총 킬수 등)
   - 업적 달성 보상 시스템

4. **PWA 개선 (선택적)**
   - 앱 업데이트 알림 기능
   - 전문 디자인 아이콘으로 교체
