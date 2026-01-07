# Extension 설치 가이드

## 🚀 자동 설치 (추천!)

### Windows (PowerShell)

```powershell
cd test-extension
.\install.ps1
```

설치 완료 후 **VS Code 재시작** 필수!

---

## 🛠️ 수동 설치

### 1단계: 빌드

```bash
cd test-extension
npm install
npm run build
```

### 2단계: VSIX 패키징

```bash
npm run package
```

→ `claude-terminal-queue-1.0.0.vsix` 파일 생성됨

### 3단계: VS Code에 설치

**방법 A: 명령줄로 설치**

```bash
code --install-extension claude-terminal-queue-1.0.0.vsix
```

**방법 B: UI로 설치**

1. VS Code 열기
2. Extensions 뷰 열기 (`Ctrl+Shift+X`)
3. `...` (More Actions) 클릭
4. **"Install from VSIX..."** 선택
5. `claude-terminal-queue-1.0.0.vsix` 선택

### 4단계: VS Code 재시작

중요! 재시작해야 Extension이 활성화됩니다.

---

## ✅ 설치 확인

1. `Ctrl+Shift+P` (명령 팔레트)
2. `Claude:` 타이핑
3. 다음 명령어들이 보이면 성공:
   - ✅ Claude: Go to Next Input Request
   - ✅ Claude: Simulate Input Request
   - ✅ Claude: Clear All Requests
   - ✅ Claude: Debug Terminal Info

---

## 🔧 Hook 연결

Extension 설치 후 `~/.claude/settings.json`에서 hook 활성화:

```json
"Notification": [
  {
    "matcher": "idle_prompt",
    "hooks": [
      {
        "type": "command",
        "command": "powershell -Command \"(New-Object System.Media.SoundPlayer 'C:\\Windows\\Media\\Windows Ding.wav').PlaySync()\""
      },
      {
        "type": "command",
        "command": "code --command claude-terminal-queue.addRequestFromHook"
      }
    ]
  }
],
"PermissionRequest": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "powershell -Command \"(New-Object System.Media.SoundPlayer 'C:\\Windows\\Media\\Windows Exclamation.wav').PlaySync()\""
      },
      {
        "type": "command",
        "command": "code --command claude-terminal-queue.addRequestFromHook"
      }
    ]
  }
]
```

**주의**: Extension이 설치되지 않은 상태에서 hook을 활성화하면 새 창이 계속 열립니다!

---

## 🧪 테스트

### 1. 수동 테스트

1. `Ctrl+Shift+P`
2. `Claude: Simulate Input Request` 실행
3. 여러 번 반복
4. **왼쪽 하단 Status Bar 확인**: `⚠️ 입력 대기: 3`
5. **클릭** 또는 **`Ctrl+Shift+I`**
6. 터미널로 자동 이동 확인!

### 2. Claude Code와 통합 테스트

1. Claude Code 실행
2. 작업 완료 대기
3. Status Bar 자동 업데이트 확인
4. `Ctrl+Shift+I`로 터미널 이동

---

## 🐛 문제 해결

**Q: 설치 후에도 명령어가 안 보여요**
→ VS Code 완전히 재시작 (모든 창 닫고 다시 열기)

**Q: Hook을 추가했는데 새 창이 자꾸 열려요**
→ Extension이 설치되지 않았거나, VS Code 재시작 안 함

**Q: Status Bar가 안 보여요**
→ `Claude: Simulate` 명령어로 테스트 요청 추가

**Q: 업데이트하려면?**
→ 같은 방법으로 재설치 (버전 덮어쓰기)

---

## 🗑️ 제거

```bash
code --uninstall-extension local.claude-terminal-queue
```

또는 VS Code Extensions 뷰에서 제거
