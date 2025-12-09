# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - Area Effect 가시성 대폭 개선 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 이번 iteration 작업 내용

### Area Effect 가시성 개선 (5종류)

1. **Whip (채찍)**
   - 외부 글로우 효과 (shadowBlur)
   - 검은색 픽셀 외곽선 (4방향)
   - 내부 하이라이트 (채찍 균열 효과)
   - 모션 슬래시 라인 (3개의 수직선)

2. **Holy Water (성수)**
   - 펄싱 글로우 효과 (시간 기반)
   - 검은색 타원 외곽선
   - 내부 밝은 그라데이션
   - 애니메이션 버블/스파클 효과 (5개 회전)

3. **Garlic (마늘)**
   - 펄싱 외부 글로우 오라
   - 검은색 원형 외곽선
   - 반투명 내부 채움
   - 회전하는 입자 효과 (6개)
   - 내부 밝은 링

4. **Explosion (폭발)**
   - 외부 글로우
   - 검은색 외곽선 링
   - 밝은 노란색 코어
   - 흰색 핫 센터
   - 8개의 스파크 입자

5. **Lightning (번개)**
   - 전기 글로우 (시안 색상)
   - 검은색 외곽선
   - 밝은 흰색 코어
   - 4개의 지그재그 번개 볼트 (랜덤 각도)

## 기존 시스템 (유지)
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 15개 패시브 아이템
- 5개 스테이지 + Hyper Mode
- 웨이브 기반 적 스폰 (30분 생존)
- 플레이어/적/투사체/경험치젬/보물상자 외곽선 및 글로우 효과

## Union 무기 목록 (작동 확인됨)
| Union 무기 | 재료 1 | 재료 2 |
|-----------|--------|--------|
| Vandalier | Peachone (MAX) | Ebony Wings (MAX) |
| Phieraggi | Phiera Der Tuphello (MAX) | Eight The Sparrow (MAX) |
| Fuwalafuwaloo | Vento Sacro (MAX) | Bloody Tear (Evolved Whip) |

## 다음 iteration 우선순위

1. **게임 밸런스 조정**
   - 새 무기/Union 무기 데미지/쿨다운 밸런싱
   - 후반 웨이브 난이도 조정

2. **PWA 지원**
   - Service Worker 추가
   - 오프라인 플레이 가능하게

3. **사운드 개선**
   - Union/Evolution 시 전용 사운드 효과
   - 보물상자 획득 사운드 개선

4. **기타 효과 가시성**
   - Pentagram, Song of Mana 등 나머지 효과들도 개선 검토
   - Bible, Cross 등 투사체 효과 강화
