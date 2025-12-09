# 2048 Game - Task Notes

## Current Status
2048 게임이 Undo 기능과 함께 완성되었습니다.

## 게임 실행 방법
```bash
# Python 사용
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속

# 또는 파일을 직접 열기
open index.html  # macOS
```

## 구현된 기능
- 4x4 그리드 게임 보드
- 키보드 조작 (화살표 키, WASD)
- 모바일 스와이프 지원
- 점수 시스템 (현재 점수 + 최고 점수)
- 최고 점수 localStorage 저장
- 게임 오버 / 승리 메시지
- 2048 달성 후 계속 플레이 옵션
- 반응형 디자인
- **다크 모드** - 테마 토글 버튼 + 시스템 설정 자동 감지 + localStorage 저장
- **Undo 기능** - Z 키 또는 Undo 버튼으로 마지막 이동 취소 (1회)

## 다음 iteration에서 고려할 개선사항
1. **애니메이션 개선** - 타일 이동 시 더 부드러운 전환 효과
2. **사운드 효과** - 타일 합체, 게임 오버 등 사운드 추가
3. **통계 기능** - 플레이 횟수, 최고 타일 등 기록
4. **PWA 지원** - 오프라인에서도 플레이 가능하도록
5. **다중 Undo** - 여러 번 되돌리기 기능 (현재는 1회만 가능)

## 파일 구조
```
/
├── index.html   # HTML 구조 (Undo, 테마 토글 버튼 포함)
├── style.css    # 스타일링 (라이트/다크 모드, 버튼 상태)
├── game.js      # 게임 로직 + ThemeManager 클래스 + Undo 기능
└── SHARED_TASK_NOTES.md
```
