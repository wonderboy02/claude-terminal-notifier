# Claude Terminal Notifier

> Claude Code가 입력을 기다릴 때 놓치지 마세요! 즉시 알림을 받으세요.

Claude Code가 작업을 완료하고 응답을 기다릴 때 **상태 표시줄 알림**을 표시하는 VS Code 확장 프로그램입니다. 알림을 클릭하거나 `Ctrl+Shift+I`를 눌러 바로 터미널로 이동할 수 있습니다.

## ✨ 기능

- 🔔 **상태 표시줄 알림**: Claude가 대기 중인지 한눈에 확인 (`💬 Claude 입력 대기: 1`)
- ⚡ **빠른 이동**: 클릭하거나 `Ctrl+Shift+I`로 대기 중인 터미널로 바로 이동
- 🎯 **스마트 큐**: FIFO 방식으로 여러 터미널 관리
- 🚫 **중복 방지**: 이미 보고 있는 터미널은 알림 안 함
- 🎨 **Claude 브랜딩**: Claude의 시그니처 오렌지/코랄 색상 사용

## 🚀 설치

### 빠른 설치

1. **다운로드**: 최신 `.vsix` 파일을 [Releases](https://github.com/wonderboy02/claude-terminal-notifier/releases)에서 다운로드
2. **설치**: VS Code에서 설치
   ```bash
   code --install-extension claude-terminal-notifier-1.0.0.vsix
   ```
3. **재시작**: VS Code 창 새로고침
4. **Hook 설정**: 아래 참조

### 소스에서 빌드

```bash
git clone https://github.com/wonderboy02/claude-terminal-notifier.git
cd claude-terminal-notifier
npm install
npm run build
npm run package
code --install-extension claude-terminal-notifier-1.0.0.vsix
```

## ⚙️ Claude Code와 연동 설정

**중요**: 이 확장 프로그램이 작동하려면 Claude Code hook을 설정해야 합니다.

### Windows 사용자

`~/.claude/settings.json`에 다음을 추가하세요:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"foreach ($port in 57843..57852) { try { Invoke-WebRequest -Uri \\\"http://localhost:$port/addRequest\\\" -Method POST -Body \\\"workspace=$PWD\\\" -TimeoutSec 0.1 -ErrorAction SilentlyContinue | Out-Null; break } catch {} }\""
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"foreach ($port in 57843..57852) { try { Invoke-WebRequest -Uri \\\"http://localhost:$port/addRequest\\\" -Method POST -Body \\\"workspace=$PWD\\\" -TimeoutSec 0.1 -ErrorAction SilentlyContinue | Out-Null; break } catch {} }\""
          }
        ]
      }
    ]
  }
}
```

### Linux/macOS 사용자

`~/.claude/settings.json`에 다음을 추가하세요:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "for port in {57843..57852}; do curl -X POST \"http://localhost:$port/addRequest\" --data \"workspace=$PWD\" --max-time 0.1 -s 2>/dev/null && break || true; done"
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "for port in {57843..57852}; do curl -X POST \"http://localhost:$port/addRequest\" --data \"workspace=$PWD\" --max-time 0.1 -s 2>/dev/null && break || true; done"
          }
        ]
      }
    ]
  }
}
```

**설정 수정 후**: Hook이 적용되려면 Claude Code를 재시작해야 합니다.

### 동작 원리

- 확장 프로그램은 포트 57843-57852 범위에서 사용 가능한 포트를 자동으로 찾습니다
- Hook은 모든 포트에 순차적으로 요청을 보내고, 성공하면 중단합니다
- 각 요청에는 현재 워크스페이스 경로(`$PWD`)가 포함됩니다
- 각 VS Code 창은 자신의 워크스페이스와 일치하는 요청만 처리합니다
- **여러 VS Code 창을 동시에 사용할 수 있습니다!**

## 📖 사용 방법

### 자동 모드 (hook 설정 후)

1. 프로젝트에서 Claude Code 시작
2. Claude와 평소처럼 작업
3. Claude가 작업을 완료하고 입력이 필요하면:
   - 🔊 소리가 들립니다 (선택사항)
   - 💬 상태 표시줄에 표시: `💬 Claude 입력 대기: 1`
4. 상태 표시줄을 클릭하거나 `Ctrl+Shift+I`를 눌러 터미널로 이동

### 수동 테스트 모드

Claude Code 없이 확장 프로그램 테스트:

1. 명령 팔레트 열기: `Ctrl+Shift+P`
2. 실행: `Claude: Simulate Input Request (Test)`
3. 상태 표시줄이 나타나야 함
4. 클릭하거나 `Ctrl+Shift+I` 누르기

## ⌨️ 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl+Shift+I` (Windows/Linux)<br>`Cmd+Shift+I` (Mac) | 다음 대기 중인 터미널로 이동 |

## 🎯 작동 원리

```
┌─────────────────────────────┐
│ Claude Code (워크스페이스 A)  │ ──> 작업 완료
└─────────────────────────────┘
       │
       ▼
  Hook 실행 ──> 모든 포트에 순차 요청
                (workspace=/path/to/A 포함)
       │
    ┌──┴────────────┬──────────────┐
    ▼               ▼              ▼
┌────────┐      ┌────────┐    ┌────────┐
│VS Code │      │VS Code │    │VS Code │
│ 창 1   │      │ 창 2   │    │ 창 3   │
│:57843  │      │:57844  │    │:57845  │
│/proj-A │ ✅   │/proj-B │ ⏭️  │/proj-C │ ⏭️
└────────┘      └────────┘    └────────┘
    │
    ▼
  워크스페이스 매칭 확인
    │
    ▼
  터미널을 큐에 추가
    │
    ▼
  상태 표시줄 업데이트: 💬 Claude 입력 대기: 1
    │
    ▼
  사용자가 클릭하거나 Ctrl+Shift+I 입력
    │
    ▼
  터미널로 포커스 이동 ✅
```

### 멀티 윈도우 지원

여러 VS Code 창을 동시에 사용할 때:
- 각 창은 다른 포트(57843-57852)를 자동으로 할당받습니다
- Hook은 모든 포트에 워크스페이스 정보와 함께 요청을 보냅니다
- 각 창은 자신의 워크스페이스와 일치하는 요청만 처리합니다
- 다른 창의 작업에 방해받지 않습니다!

## 🔧 문제 해결

### 상태 표시줄이 안 보여요?

1. 확장 프로그램 설치 확인: `Ctrl+Shift+P` → `Extensions: Show Installed Extensions`
2. `~/.claude/settings.json`에 hook이 설정되어 있는지 확인
3. 설정 수정 후 Claude Code 재시작
4. 수동 테스트: `Ctrl+Shift+P` → `Claude: Simulate Input Request`

### Hook이 작동하지 않아요?

1. Claude Code를 **디버그 모드**로 실행: `claude --debug`
2. 디버그 출력에서 hook 실행 확인
3. `curl` 사용 가능 확인: `curl --version`
4. 확장 프로그램의 HTTP 서버가 실행 중인지 확인 (VS Code 콘솔 참조)

### 알림이 계속 쌓여요?

확장 프로그램이 자동으로:
- ✅ 같은 터미널의 중복 항목 방지
- ✅ 이미 포커스된 터미널 건너뛰기
- ✅ 닫힌 터미널을 큐에서 제거

## 🛠️ 개발

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 패키징
npm run package

# Watch 모드 (개발용)
npm run watch
```

## 📝 명령어

| 명령어 | 설명 |
|--------|------|
| `Claude: Go to Next Input Request` | 다음 대기 중인 터미널로 이동 |
| `Claude: Simulate Input Request (Test)` | 테스트 알림 추가 |
| `Claude: Clear All Requests` | 알림 큐 전체 비우기 |
| `Claude: Debug Terminal Info` | 터미널 디버그 정보 표시 |

## 🌍 크로스 플랫폼 지원

- ✅ Windows
- ✅ macOS
- ✅ Linux

HTTP 요청에 표준 `curl`을 사용합니다 (모든 플랫폼에서 사용 가능).

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 🙏 크레딧

[Claude Code](https://claude.com/claude-code) 커뮤니티를 위해 ❤️로 만들었습니다.

---

## 📦 VS Code Marketplace에 배포하기 (선택사항)

VS Code Marketplace에 배포하려면:

### 준비사항

1. **Publisher 계정 생성**:
   - https://marketplace.visualstudio.com/manage 방문
   - Microsoft/GitHub 계정으로 로그인
   - Publisher ID 생성

2. **`package.json` 수정**:
   ```json
   {
     "publisher": "your-publisher-id",  // "local"에서 변경
     "icon": "icon.png"  // 128x128 PNG 아이콘 추가
   }
   ```

3. **파일 추가**:
   - `icon.png` 생성 (128x128, PNG)
   - `.vscodeignore` 추가하여 불필요한 파일 제외
   - `CHANGELOG.md` 생성

4. **Personal Access Token 발급**:
   ```bash
   # Azure DevOps에서
   # Settings → Personal Access Tokens → New Token
   # Scope: Marketplace (Manage)
   ```

5. **배포**:
   ```bash
   # vsce 전역 설치
   npm install -g @vscode/vsce

   # 로그인
   vsce login your-publisher-id

   # 배포
   vsce publish
   ```

### 배포 체크리스트

- [ ] Publisher 계정 생성
- [ ] package.json의 `publisher` 변경
- [ ] icon.png 추가 (128x128)
- [ ] CHANGELOG.md 생성
- [ ] .vscodeignore 추가
- [ ] Azure DevOps PAT 발급
- [ ] `vsce publish` 실행

자세한 가이드: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
