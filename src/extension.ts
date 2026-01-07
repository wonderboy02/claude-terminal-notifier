import * as vscode from 'vscode';
import * as http from 'http';
import { TerminalQueueManager } from './queue-manager';
import { StatusBarManager } from './status-bar-manager';
import { TerminalDetector } from './terminal-detector';

let queueManager: TerminalQueueManager;
let statusBarManager: StatusBarManager;
let httpServer: http.Server | undefined;

/**
 * Extension 활성화
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 Claude Terminal Queue Manager 활성화됨!');

  // Queue Manager 초기화
  queueManager = new TerminalQueueManager();
  statusBarManager = new StatusBarManager();

  // Queue 변경 시 Status Bar 업데이트
  queueManager.onQueueChanged((count) => {
    statusBarManager.updateQueueCount(count);
  });

  // 명령어 1: 다음 대기 중인 터미널로 이동
  const nextInQueueCommand = vscode.commands.registerCommand(
    'claude-terminal-queue.nextInQueue',
    async () => {
      if (queueManager.isEmpty()) {
        vscode.window.showInformationMessage('대기 중인 입력 요청이 없습니다.');
        return;
      }

      // 큐에서 다음 항목 가져오기 (제거하지 않음)
      const request = queueManager.peek();
      if (!request) {
        return;
      }

      // 터미널이 아직 살아있는지 확인
      const terminals = vscode.window.terminals;
      if (!terminals.includes(request.terminal)) {
        // 터미널이 닫혔으면 큐에서 제거하고 다음 항목으로
        queueManager.dequeue();
        vscode.window.showWarningMessage(`터미널 "${request.terminal.name}"이 닫혔습니다. 다음 항목으로 이동합니다.`);

        // 재귀적으로 다음 항목 처리
        if (!queueManager.isEmpty()) {
          vscode.commands.executeCommand('claude-terminal-queue.nextInQueue');
        }
        return;
      }

      // 해당 터미널로 포커스 이동 (입력 없이 포커스만)
      request.terminal.show(true); // preserveFocus = false

      // 큐에서 제거
      queueManager.dequeue();

      // 남은 개수 알림
      const remaining = queueManager.length;
      if (remaining > 0) {
        vscode.window.showInformationMessage(
          `${request.terminal.name}로 이동했습니다. (남은 대기: ${remaining}개)`,
          '다음 항목'
        ).then(selection => {
          if (selection === '다음 항목') {
            vscode.commands.executeCommand('claude-terminal-queue.nextInQueue');
          }
        });
      } else {
        vscode.window.showInformationMessage(`${request.terminal.name}로 이동했습니다.`);
      }

      console.log(`[Extension] 터미널로 이동: ${request.terminal.name}`);
    }
  );

  // 명령어 2: 입력 요청 시뮬레이션 (테스트용)
  const simulateRequestCommand = vscode.commands.registerCommand(
    'claude-terminal-queue.simulateRequest',
    async () => {
      // 활성 터미널이 없으면 새로 생성
      let terminal = vscode.window.activeTerminal;
      if (!terminal) {
        terminal = vscode.window.createTerminal('Test Terminal');
      }

      // 랜덤 질문 생성
      const questions = [
        '좋아하는 색은?',
        'API 키를 입력하세요',
        '프로젝트 이름을 입력하세요',
        '계속하시겠습니까? (y/n)',
        '데이터베이스를 선택하세요'
      ];
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

      // 큐에 추가
      queueManager.enqueue(terminal, randomQuestion);

      vscode.window.showInformationMessage(
        `입력 요청 추가됨: "${randomQuestion}" (총 ${queueManager.length}개)`
      );
    }
  );

  // 명령어 3: 큐 전체 비우기
  const clearQueueCommand = vscode.commands.registerCommand(
    'claude-terminal-queue.clearQueue',
    async () => {
      const count = queueManager.length;
      if (count === 0) {
        vscode.window.showInformationMessage('큐가 이미 비어있습니다.');
        return;
      }

      const answer = await vscode.window.showWarningMessage(
        `${count}개의 대기 중인 요청을 모두 삭제하시겠습니까?`,
        '삭제',
        '취소'
      );

      if (answer === '삭제') {
        queueManager.clear();
        vscode.window.showInformationMessage(`${count}개의 요청이 삭제되었습니다.`);
      }
    }
  );

  // 명령어 5: 디버그 - 터미널 정보 출력
  const debugTerminalsCommand = vscode.commands.registerCommand(
    'claude-terminal-queue.debugTerminals',
    async () => {
      await TerminalDetector.debugAllTerminals();
      vscode.window.showInformationMessage('터미널 정보를 콘솔에 출력했습니다. (개발자 도구 확인)');
    }
  );

  // 명령어 4: Hook에서 호출할 명령어 (활성 터미널을 큐에 추가)
  const addRequestFromHookCommand = vscode.commands.registerCommand(
    'claude-terminal-queue.addRequestFromHook',
    async () => {
      try {
        // 활성 터미널 가져오기
        const terminal = vscode.window.activeTerminal;

        if (!terminal) {
          // 조용히 무시 (로그만)
          console.log('[Hook] 활성 터미널이 없음 - 무시');
          return;
        }

        // 터미널이 이미 focus되어 있으면 추가하지 않음
        // (사용자가 이미 보고 있는 터미널에 알림 불필요)
        const isTerminalVisible = vscode.window.terminals.includes(terminal);
        if (isTerminalVisible && terminal === vscode.window.activeTerminal) {
          console.log(`[Hook] 터미널 "${terminal.name}"이 이미 focus됨 - 무시`);
          return;
        }

        // 큐에 추가 (조용히, 알림 없이)
        // queue-manager에서 중복 체크를 하므로 여기서는 하지 않음
        queueManager.enqueue(terminal, '사용자 입력이 필요합니다');

        console.log(`[Hook] 터미널 추가됨: ${terminal.name} (총 ${queueManager.length}개)`);
      } catch (error) {
        // 모든 에러를 조용히 무시 (사용자에게 표시 안 함)
        console.log('[Hook] 에러 발생했지만 무시:', error);
      }
    }
  );

  // 터미널 닫힐 때 큐에서 자동 제거
  const terminalCloseListener = vscode.window.onDidCloseTerminal((terminal) => {
    const removed = queueManager.remove(terminal);
    if (removed) {
      console.log(`[Extension] 터미널 닫힘으로 큐에서 제거: ${terminal.name}`);
    }
  });

  // HTTP 서버 시작 (Hook 통신용)
  const PORT = 57843; // 고정 포트 (충돌 방지를 위해 높은 번호 사용)

  httpServer = http.createServer((req, res) => {
    // CORS 헤더 (필요 시)
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'POST' && req.url === '/addRequest') {
      // Hook에서 요청이 들어옴
      console.log('[HTTP Server] Hook 요청 수신');

      // 명령어 실행
      vscode.commands.executeCommand('claude-terminal-queue.addRequestFromHook');

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  httpServer.listen(PORT, 'localhost', () => {
    console.log(`[HTTP Server] 시작됨: http://localhost:${PORT}`);
  });

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[HTTP Server] 포트 ${PORT}가 이미 사용 중입니다. 다른 Extension 인스턴스가 실행 중일 수 있습니다.`);
    } else {
      console.error('[HTTP Server] 에러:', err);
    }
  });

  // 등록
  context.subscriptions.push(
    nextInQueueCommand,
    simulateRequestCommand,
    clearQueueCommand,
    debugTerminalsCommand,
    addRequestFromHookCommand,
    terminalCloseListener,
    queueManager,
    statusBarManager,
    {
      dispose: () => {
        if (httpServer) {
          httpServer.close();
          console.log('[HTTP Server] 종료됨');
        }
      }
    }
  );

  // 초기 메시지
  vscode.window.showInformationMessage(
    '✅ Claude Terminal Queue Manager 활성화! (Ctrl+Shift+I로 다음 요청으로 이동)'
  );
}

/**
 * Extension 비활성화
 */
export function deactivate() {
  console.log('Claude Terminal Queue Manager 비활성화됨');
}

/**
 * 외부에서 사용할 수 있는 API
 * (다른 extension이나 테스트에서 사용)
 */
export function getQueueManager(): TerminalQueueManager {
  return queueManager;
}

export function getStatusBarManager(): StatusBarManager {
  return statusBarManager;
}
