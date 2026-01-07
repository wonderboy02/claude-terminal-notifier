# Claude Terminal Queue Manager

VS Code에서 여러 터미널의 입력 요청을 큐로 관리하는 Extension입니다.

## 🎯 목표

Claude Code처럼 여러 터미널을 사용할 때, 어느 터미널에서 입력이 필요한지 쉽게 알 수 있도록:

1. **Status Bar에 대기 개수 표시**: `⚠️ 입력 대기: 3`
2. **클릭 or 단축키로 해당 터미널로 자동 포커스**
3. **FIFO 큐 방식**: 먼저 요청된 터미널부터 처리

## 📋 기능

- ✅ **Queue 시스템**: FIFO 방식으로 입력 요청 관리
- ✅ **Status Bar 버튼**: 대기 중인 터미널 개수 실시간 표시
- ✅ **단축키**: `Ctrl+Shift+I` (Mac: `Cmd+Shift+I`)
- ✅ **자동 포커스**: 클릭/단축키로 다음 터미널로 자동 이동
- ✅ **터미널 내 강조**: 눈에 띄는 노란색 배너로 입력 요청 표시
- ✅ **자동 정리**: 터미널 닫힐 때 큐에서 자동 제거

## 🚀 사용 방법

### 1. Extension 설치 및 실행

```bash
cd test-extension
npm install
npm run build
```

### 2. VS Code에서 Extension 실행

**방법 1: F5 키로 디버그 모드 실행**
1. VS Code에서 `test-extension` 폴더 열기
2. `F5` 키 누르기
3. 새 VS Code 창(Extension Development Host)이 열림

**방법 2: Extension 설치**
```bash
npm run package  # .vsix 파일 생성
# VS Code에서: Extensions → ... → Install from VSIX
```

### 3. 테스트 시나리오

Extension이 활성화되면 다음과 같이 테스트하세요:

#### A. 명령 팔레트로 시뮬레이션 (추천!)

1. `Ctrl+Shift+P` (또는 `Cmd+Shift+P`)
2. `Claude: Simulate Input Request` 입력 및 실행
3. 여러 번 실행하여 큐에 3-5개 추가
4. **Status Bar 확인**: 왼쪽 하단에 `⚠️ 입력 대기: 3` 표시됨
5. **Status Bar 클릭** 또는 **`Ctrl+Shift+I`** 단축키 실행
6. 첫 번째 터미널로 자동 포커스 이동
7. 노란색 배너 확인
8. 다시 단축키 실행하여 다음 터미널로 이동

#### B. 직접 테스트

```typescript
// 다른 extension에서 사용할 경우
const queueManager = extensions.getExtension('local.claude-terminal-queue')
  ?.exports.getQueueManager();

queueManager.enqueue(myTerminal, '사용자 입력이 필요합니다');
```

## ⌨️ 명령어 및 단축키

| 명령어 | 단축키 | 설명 |
|--------|--------|------|
| `Claude: Go to Next Input Request` | `Ctrl+Shift+I` | 다음 대기 중인 터미널로 이동 |
| `Claude: Simulate Input Request` | - | 테스트용 입력 요청 추가 |
| `Claude: Clear All Requests` | - | 큐 전체 비우기 |

## 🎨 UI 요소

### Status Bar (왼쪽 하단)
```
[⚠️ 입력 대기: 3] ← 클릭 가능!
```

### 터미널 배너 (포커스 시)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  입력이 필요합니다!
  좋아하는 색은?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔍 동작 방식

1. **입력 요청 발생** → 큐에 추가
2. **Status Bar 업데이트** → `⚠️ 입력 대기: N`
3. **사용자 클릭 or 단축키** → 첫 번째 터미널로 포커스
4. **노란색 배너 표시** → 입력 요청 내용 강조
5. **큐에서 제거** → 다음 항목 대기
6. **큐가 비면** → Status Bar 자동 숨김

## 📦 다음 단계

이 Extension이 정상 동작하면:

1. ✅ **Queue 시스템 완성** - 현재 완료!
2. 🔄 **Claude Code와 통합** - Claude API 응답 감지해서 자동으로 큐에 추가
3. 📦 **VSIX 패키징** - 다른 프로젝트/팀원과 공유
4. 🚀 **VS Code Marketplace 배포** - 공개 extension으로 배포

## 💡 팁

- **여러 터미널 띄워놓기**: 터미널 3-5개 열어두고 테스트
- **단축키 활용**: `Ctrl+Shift+I` 한 번에 바로 이동
- **큐 확인**: Status Bar 툴팁에 마우스 올려서 대기 개수 확인

## 🐛 트러블슈팅

**Q: Status Bar가 안 보여요**
- Extension이 활성화되었는지 확인 (`Ctrl+Shift+P` → `Claude: Simulate`)
- 큐에 항목이 있는지 확인 (없으면 자동 숨김)

**Q: 단축키가 안 먹혀요**
- 다른 extension과 충돌 가능성 확인
- `Ctrl+K Ctrl+S`로 키바인딩 확인

**Q: 터미널로 포커스가 안 이동해요**
- 터미널이 닫혔을 수 있음 (자동으로 다음 항목 처리)
- 콘솔 확인 (`Help` → `Toggle Developer Tools`)
