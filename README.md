# Game Hub

혼자서 즐기는 온라인 게임 컬렉션입니다. 7개의 클래식/캐주얼 게임을 브라우저에서 플레이할 수 있습니다.

## 게임 목록

| 게임 | 설명 | 코드 규모 |
|------|------|----------|
| **2048** | 숫자 타일을 합쳐서 2048 만들기 | 745 lines |
| **Snake** | 뱀을 조종해 먹이를 먹고 성장 | 556 lines |
| **Minesweeper** | 지뢰를 피해 모든 칸 열기 | 405 lines |
| **Tetris** | 떨어지는 블록으로 줄 완성 | 888 lines |
| **Breakout** | 패들로 공을 튕겨 벽돌 깨기 | 637 lines |
| **Memory** | 같은 그림 카드 짝 찾기 | 382 lines |
| **Pixel Survivor** | Vampire Survivors 스타일 생존 게임 | 8,358 lines |

## 빠른 시작

```bash
# Python 간단 서버 사용
python -m http.server 8000

# 브라우저에서 접속
open http://localhost:8000
```

## 주요 기능

### PWA 지원
- **오프라인 플레이**: Service Worker로 모든 게임 자산 캐싱
- **설치 가능**: 모바일/데스크탑에 앱으로 설치 가능
- **반응형 디자인**: 모바일, 태블릿, 데스크탑 지원

### 테마
- **다크 모드/라이트 모드**: 시스템 설정 자동 감지 및 수동 토글
- **localStorage 저장**: 테마 설정 영구 저장

### 공통 게임 기능
- **Web Audio API 사운드**: 각 게임별 효과음
- **최고 점수 저장**: localStorage 기반 기록 저장
- **키보드/터치 지원**: 다양한 입력 방식

---

## 프로젝트 구조

```
continuous-claude-test/
├── index.html          # 메인 허브 페이지
├── style.css           # 허브 스타일
├── hub.js              # 테마 관리, Service Worker 등록
├── sw.js               # Service Worker (PWA 캐싱)
├── manifest.json       # PWA 매니페스트
├── icons/              # PWA 아이콘 (72~512px)
└── games/
    ├── 2048/
    │   ├── index.html
    │   ├── style.css
    │   └── game.js
    ├── snake/
    ├── minesweeper/
    ├── tetris/
    ├── breakout/
    ├── memory/
    └── survivor/       # Pixel Survivor (대규모 게임)
```

---

## 게임별 상세 정보

### Pixel Survivor

Vampire Survivors 스타일의 대규모 생존 게임으로, 프로젝트 전체 코드의 약 50%를 차지합니다.

#### 콘텐츠
- **8개 캐릭터**: Antonio, Imelda, Gennaro, Pasqualina, Poe, Arca, Porta, Dommario
- **12개 기본 무기** + **12개 진화 무기** + **6개 신규 무기** + **3개 Union 무기**
- **5개 스테이지**: Mad Forest, Inlaid Library, Dairy Plant, Gallo Tower, Cappella Magna
- **Hyper Mode**: 각 스테이지별 고난도 모드
- **12개 아케인**: 게임 모디파이어 시스템
- **15개 패시브 아이템**
- **30개 업적**

#### 시스템
- **파티클 시스템**: 시각적 이펙트 (화면 흔들림 포함)
- **진화 시스템**: 기본 무기 + 특정 패시브 = 진화 무기
- **Union 시스템**: 특정 진화 무기 조합 = Union 무기
- **사운드 시스템**: evolution, union, chest, victory 전용 효과음

#### 최근 개선 사항
- Thousand Edge (진화 Knife) 시각 효과
- Death Spiral (진화 Axe) 시각 효과
- Hellfire (진화 Fire Wand) 시각 효과

### 기타 게임

모든 게임이 공통 패턴을 따릅니다:
- `SoundManager` 클래스: Web Audio API 기반 효과음
- `Game[Name]` 클래스: 게임 로직 캡슐화
- localStorage: 최고 점수 및 설정 저장
- 반응형 canvas 렌더링

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | Vanilla JavaScript (ES6+), HTML5 Canvas |
| **Styling** | CSS3 (CSS Variables, Flexbox, Grid) |
| **Audio** | Web Audio API |
| **PWA** | Service Worker, Web App Manifest |
| **Storage** | localStorage |

### 의존성
- **외부 라이브러리 없음**: 순수 JavaScript로 구현
- **빌드 도구 없음**: 별도 빌드 과정 불필요

---

## 개발 가이드

### 새 게임 추가

1. `games/[game-name]/` 디렉토리 생성
2. `index.html`, `style.css`, `game.js` 파일 생성
3. `index.html`의 games-grid에 게임 카드 추가
4. `sw.js`의 `ASSETS_TO_CACHE`에 파일 경로 추가
5. 캐시 버전 업데이트 (`CACHE_NAME`)

### 코드 패턴

```javascript
// SoundManager 패턴
class SoundManager {
    constructor() {
        this.enabled = this.loadSoundPreference();
        this.audioContext = null;
    }
    // ...
}

// Game 클래스 패턴
class Game[Name] {
    constructor(soundManager) {
        // 초기화
    }

    init() { /* 게임 초기화 */ }
    update() { /* 게임 로직 업데이트 */ }
    render() { /* 화면 렌더링 */ }
    // ...
}
```

### localStorage 키 네이밍
- `[game]-sound`: 사운드 설정 (true/false)
- `[game]-best-score`: 최고 점수
- `game-hub-theme`: 전역 테마 설정 (dark/light)

---

## 브라우저 지원

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Canvas 2D, Web Audio API, Service Worker, localStorage 지원 필요.

---

## 라이선스

이 프로젝트는 개인 학습 및 테스트 목적으로 생성되었습니다.
