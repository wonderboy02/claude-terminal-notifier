# 동작 원리 상세 설명

## 🔍 문제: 여러 VS Code 창 관리

### 시나리오
```
창 1: 프로젝트 A (C:\project-a)      창 2: 프로젝트 B (C:\project-b)
├─ Terminal 1: Claude Code 실행       ├─ Terminal 5: bash
│   └─ 입력 요청 발생!                └─ 큐: []
├─ 큐: [Terminal 1] ✅
└─ Status Bar: ⚠️ 1                 └─ Status Bar: (숨김)
```

**문제**: Hook이 전역 명령어로 실행되면 어느 창의 큐에 추가해야 할까?

## 💡 해결책: Workspace 기반 감지

### 1️⃣ Hook 실행 흐름

```
Claude Code → AskUserQuestion
    ↓
PermissionRequest Hook 트리거
    ↓
전역 명령어 실행: code --command claude-terminal-queue.addRequestFromHook
    ↓
모든 VS Code 창에서 Extension이 명령어 받음
    ↓
각 Extension 인스턴스에서 검증:
    ├─ 창 1: "활성 터미널이 내 workspace에 속하나?" → YES ✅
    │   └─ 큐에 추가
    └─ 창 2: "활성 터미널이 내 workspace에 속하나?" → NO ❌
        └─ 무시
```

### 2️⃣ Workspace 감지 방법

```typescript
// 1. 터미널 프로세스 ID 가져오기
const processId = await terminal.processId;  // 예: 12345

// 2. 프로세스의 작업 디렉토리(CWD) 조회
// Windows: PowerShell 사용
powershell -Command "(Get-Process -Id 12345).Path | Split-Path -Parent"
// → 결과: C:\project-a

// 3. Workspace 폴더와 비교
const workspaceFolders = vscode.workspace.workspaceFolders;
// 창 1: [C:\project-a]
// 창 2: [C:\project-b]

// 4. CWD가 workspace에 속하는지 확인
cwd.startsWith(workspaceFolder.uri.fsPath)
// 창 1: "C:\project-a".startsWith("C:\project-a") → true ✅
// 창 2: "C:\project-a".startsWith("C:\project-b") → false ❌
```

### 3️⃣ 실제 코드

```typescript
// terminal-detector.ts
static async isTerminalInCurrentWorkspace(terminal: vscode.Terminal): Promise<boolean> {
  // 1. 터미널의 CWD 가져오기
  const cwd = await this.getTerminalCwd(terminal);

  // 2. Workspace 폴더 가져오기
  const workspaceFolders = vscode.workspace.workspaceFolders;

  // 3. CWD가 workspace 폴더에 속하는지 확인
  return workspaceFolders.some(folder =>
    cwd.startsWith(folder.uri.fsPath)
  );
}

// extension.ts
const addRequestFromHookCommand = vscode.commands.registerCommand(
  'claude-terminal-queue.addRequestFromHook',
  async () => {
    const terminal = vscode.window.activeTerminal;

    // 이 터미널이 현재 workspace에 속하는지 확인!
    const isInWorkspace = await TerminalDetector.isTerminalInCurrentWorkspace(terminal);

    if (!isInWorkspace) {
      console.log('다른 workspace의 터미널 - 무시');
      return;
    }

    // 내 workspace의 터미널이면 큐에 추가
    queueManager.enqueue(terminal, '입력이 필요합니다');
  }
);
```

## 🎯 결과

### 성공 케이스
```
Hook 발동
    ↓
창 1 Extension:
  활성 터미널 = Terminal 1
  Terminal 1 CWD = C:\project-a
  Workspace = C:\project-a
  → 일치! 큐에 추가 ✅

창 2 Extension:
  활성 터미널 = Terminal 1 (다른 창의 터미널)
  Terminal 1 CWD = C:\project-a
  Workspace = C:\project-b
  → 불일치! 무시 ❌
```

### 최종 상태
```
창 1 (프로젝트 A):
├─ 큐: [Terminal 1] ✅
└─ Status Bar: ⚠️ 입력 대기: 1

창 2 (프로젝트 B):
├─ 큐: [] (비어있음)
└─ Status Bar: (숨김)
```

## 🔬 디버그 방법

### 터미널 정보 확인

명령 팔레트 → `Claude: Debug Terminal Info`

콘솔 출력:
```
=== Terminal Debug Info ===
Total terminals: 3

Terminal: bash
  Process ID: 12345
  CWD: C:\project-a\src
  In Workspace: true

Terminal: powershell
  Process ID: 67890
  CWD: C:\project-b
  In Workspace: false

Terminal: node
  Process ID: 11111
  CWD: C:\project-a
  In Workspace: true
=========================
```

## 🌟 핵심 장점

1. **정확성**: CWD 기반으로 정확한 workspace 식별
2. **독립성**: 각 창의 큐가 완전히 독립적
3. **자동화**: 사용자가 신경 쓸 필요 없음
4. **확장성**: 여러 창, 여러 프로젝트 동시 작업 가능

## ⚠️ 제한사항

1. **CWD 조회 실패 가능성**
   - 프로세스가 종료된 경우
   - 권한 문제
   → 해결: 실패 시 조용히 무시

2. **플랫폼별 구현**
   - Windows: PowerShell
   - Linux: pwdx
   - Mac: lsof
   → 각 플랫폼에 맞게 구현됨

3. **Workspace 없는 경우**
   - 단일 파일 열기 모드
   → 해결: workspace 없으면 모든 터미널 허용

## 📊 성능

- **CWD 조회**: ~10-50ms (프로세스 쿼리)
- **Workspace 비교**: <1ms (문자열 비교)
- **총 오버헤드**: ~50ms (사용자가 느낄 수 없음)
