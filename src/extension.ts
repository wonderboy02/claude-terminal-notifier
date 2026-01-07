import * as vscode from 'vscode';
import { TerminalQueueManager } from './queue-manager';
import { StatusBarManager } from './status-bar-manager';
import { TerminalDetector } from './terminal-detector';

let queueManager: TerminalQueueManager;
let statusBarManager: StatusBarManager;

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

      // 해당 터미널로 포커스 이동
      request.terminal.show(true); // preserveFocus = false

      // 터미널에 눈에 띄는 메시지 표시
      request.terminal.sendText('\n\x1b[43m\x1b[30m\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
      request.terminal.sendText('\x1b[43m\x1b[30m\x1b[1m  ⚠️  입력이 필요합니다!  \x1b[0m');
      request.terminal.sendText(`\x1b[43m\x1b[30m\x1b[1m  ${request.question}\x1b[0m`);
      request.terminal.sendText('\x1b[43m\x1b[30m\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

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

        // 이 터미널이 현재 workspace에 속하는지 확인
        const isInWorkspace = await TerminalDetector.isTerminalInCurrentWorkspace(terminal);

        if (!isInWorkspace) {
          // 조용히 무시 (로그만)
          console.log(`[Hook] 터미널 "${terminal.name}"은 다른 workspace에 속함 - 무시`);
          return;
        }

        // 큐에 추가 (조용히, 알림 없이)
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

  // 등록
  context.subscriptions.push(
    nextInQueueCommand,
    simulateRequestCommand,
    clearQueueCommand,
    debugTerminalsCommand,
    addRequestFromHookCommand,
    terminalCloseListener,
    queueManager,
    statusBarManager
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
