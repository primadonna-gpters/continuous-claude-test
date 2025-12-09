# Game Hub - Task Notes

## Current Status
멀티 게임 허브 완성. 2048, Snake, Minesweeper, Tetris, Breakout, Memory, Pixel Survivor 7개 게임 플레이 가능.
**Pixel Survivor - Union 시스템 개선 및 픽업 아이템 가시성 개선 완료!**

## 게임 실행 방법
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## Pixel Survivor - 이번 iteration 작업 내용

### 1. Union 트리거 로직 개선
- `checkUnion()` 함수 수정: 진화된 무기도 Union 파트너로 인식
- `performUnion()` 함수 수정: evolved weapon의 evolvedId로 unionInfo 조회
- UI에서 `canUnion` 체크 시 `!w.evolved` 조건 제거

### 2. Fuwalafuwaloo Union 버그 수정
- `EVOLVED_WEAPONS.bloodyTear`에 `unionWith`, `unionResult` 추가
- `WEAPON_TYPES`에 `bloodyTear` 항목 추가 (unionInfo 조회용)
- 이제 Vento Sacro + Bloody Tear(진화된 Whip) → Fuwalafuwaloo 합체 가능

### 3. 경험치 젬 가시성 향상
- 펄싱 글로우 효과 추가 (크기에 따라 다른 색상)
- 검은색 픽셀 외곽선 추가
- 추가 하이라이트로 입체감 향상
- 젬 크기별 색상: 소(파랑), 중(초록), 대(빨강)

### 4. 보물상자 가시성 향상
- 황금빛 방사형 글로우 효과 추가
- 검은색 외곽선으로 윤곽 강조
- 상세한 나무 텍스처 (어두운/밝은 나무)
- 황금 장식 및 자물쇠 디테일
- 빛 반사 효과

## 기존 시스템 (유지)
- 스테이지별 배경 그래픽 (5종)
- 아케인 시스템 (12종)
- 8개 캐릭터
- 12개 기본 무기 + 12개 진화 무기 + 6개 새 무기 + 3개 Union 무기
- 15개 패시브 아이템
- 5개 스테이지 + Hyper Mode
- 웨이브 기반 적 스폰 (30분 생존)
- 플레이어/적/투사체 외곽선 및 글로우 효과

## Union 무기 목록 (작동 확인됨)
| Union 무기 | 재료 1 | 재료 2 |
|-----------|--------|--------|
| Vandalier | Peachone (MAX) | Ebony Wings (MAX) |
| Phieraggi | Phiera Der Tuphello (MAX) | Eight The Sparrow (MAX) |
| Fuwalafuwaloo | Vento Sacro (MAX) | Bloody Tear (Evolved Whip) |

## 다음 iteration 우선순위

1. **Area Effect 가시성 개선**
   - Whip, Holy Water, Garlic 등 영역 효과에 글로우/외곽선 추가
   - 영역 범위 시각적 표시 강화

2. **게임 밸런스 조정**
   - 새 무기/Union 무기 데미지/쿨다운 밸런싱
   - 후반 웨이브 난이도 조정

3. **PWA 지원**
   - Service Worker 추가
   - 오프라인 플레이 가능하게

4. **사운드 개선**
   - Union/Evolution 시 전용 사운드 효과
   - 보물상자 획득 사운드 개선
