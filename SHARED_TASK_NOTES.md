# 2048 Game - Task Notes

## Current Status
2048 게임이 사운드 효과와 함께 완성되었습니다.

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 구현된 기능
- 4x4 그리드 게임 보드
- 키보드 조작 (화살표 키, WASD)
- 모바일 스와이프 지원
- 점수 시스템 (현재 점수 + 최고 점수, localStorage 저장)
- 게임 오버 / 승리 메시지
- 2048 달성 후 계속 플레이 옵션
- 반응형 디자인
- 다크 모드 - 테마 토글 버튼 + 시스템 설정 자동 감지
- Undo 기능 - Z 키 또는 Undo 버튼 (1회)
- 타일 이동 애니메이션 - 부드러운 슬라이드 + 병합 효과
- **사운드 효과** - Web Audio API 기반 (합체, 새 타일, 승리, 게임오버, Undo)

## 다음 iteration에서 고려할 개선사항
1. **통계 기능** - 플레이 횟수, 최고 타일 등 기록
2. **PWA 지원** - 오프라인에서도 플레이 가능하도록
3. **다중 Undo** - 여러 번 되돌리기 기능 (현재는 1회만 가능)
4. **키보드 단축키 안내** - M 키로 소리 켜기/끄기 등

## 파일 구조
```
├── index.html   # HTML 구조
├── style.css    # 스타일링 (라이트/다크 모드)
├── game.js      # SoundManager + Game2048 + ThemeManager
└── SHARED_TASK_NOTES.md
```
