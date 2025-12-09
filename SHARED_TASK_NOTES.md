# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**PWA 지원 추가 완료! 오프라인에서도 게임 플레이 가능.**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## PWA (Progressive Web App) 지원

### 추가된 파일
- `manifest.json`: 앱 메타데이터 정의
- `sw.js`: Service Worker (오프라인 캐싱)
- `icons/`: PWA 아이콘 (16px ~ 512px)
- `icons/generate-icons.html`: 아이콘 생성기 (선택적)

### 설치 방법
1. Chrome/Edge: 주소창 오른쪽 설치 아이콘 클릭
2. iOS Safari: 공유 > 홈 화면에 추가

## 기존 시스템 (유지)
- Pixel Survivor 게임 밸런스 조정 완료
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터, 15개 패시브 아이템
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 5개 스테이지 + Hyper Mode

## 다음 iteration 우선순위

1. **사운드 개선**
   - Union/Evolution 시 전용 사운드 효과
   - 보물상자 획득 사운드 개선

2. **추가 시각 효과**
   - Pentagram, Song of Mana 등 효과 개선
   - Bible, Cross 등 투사체 효과 강화

3. **추가 콘텐츠**
   - 새로운 캐릭터 또는 무기 추가
   - 업적 시스템

4. **PWA 개선 (선택적)**
   - 앱 업데이트 알림 기능
   - 전문 디자인 아이콘으로 교체
