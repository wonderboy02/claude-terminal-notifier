import * as vscode from 'vscode';
import * as child_process from 'child_process';

/**
 * 터미널 정보 감지 유틸리티
 */
export class TerminalDetector {
  /**
   * 터미널의 현재 작업 디렉토리(CWD) 가져오기
   */
  static async getTerminalCwd(terminal: vscode.Terminal): Promise<string | undefined> {
    try {
      // 방법 1: Shell Integration API 사용 (가장 정확함!)
      // VS Code 1.72+ 부터 사용 가능
      if (terminal.shellIntegration?.cwd) {
        const cwdUri = terminal.shellIntegration.cwd;
        const cwd = cwdUri.fsPath;
        console.log(`[TerminalDetector] Shell Integration CWD: ${cwd}`);
        return cwd;
      }

      // 방법 2: 프로세스 ID로 조회 (fallback)
      const processId = await terminal.processId;
      if (!processId) {
        return undefined;
      }

      // Windows: PowerShell로 프로세스 CWD 조회
      if (process.platform === 'win32') {
        return new Promise((resolve) => {
          // 수정: CommandLine에서 작업 디렉토리 추출 시도
          const cmd = `powershell -Command "Get-CimInstance Win32_Process -Filter \\"ProcessId = ${processId}\\" | Select-Object -ExpandProperty CommandLine"`;

          child_process.exec(cmd, (error, stdout) => {
            if (error) {
              console.log(`[TerminalDetector] CWD 조회 실패:`, error);
              resolve(undefined);
            } else {
              const cmdLine = stdout.trim();
              console.log(`[TerminalDetector] CommandLine: ${cmdLine}`);
              resolve(undefined); // CommandLine에서 CWD 추출은 복잡하므로 일단 undefined
            }
          });
        });
      }

      // Linux/Mac: pwdx 또는 lsof 사용
      if (process.platform === 'linux' || process.platform === 'darwin') {
        return new Promise((resolve) => {
          // Linux: pwdx
          let cmd = `pwdx ${processId} | awk '{print $2}'`;

          // Mac: lsof
          if (process.platform === 'darwin') {
            cmd = `lsof -a -d cwd -p ${processId} | tail -1 | awk '{print $9}'`;
          }

          child_process.exec(cmd, (error, stdout) => {
            if (error) {
              console.log(`[TerminalDetector] CWD 조회 실패:`, error);
              resolve(undefined);
            } else {
              const cwd = stdout.trim();
              resolve(cwd || undefined);
            }
          });
        });
      }

      return undefined;
    } catch (error) {
      console.log(`[TerminalDetector] 오류:`, error);
      return undefined;
    }
  }

  /**
   * 터미널이 현재 workspace에 속하는지 확인
   */
  static async isTerminalInCurrentWorkspace(terminal: vscode.Terminal): Promise<boolean> {
    const cwd = await this.getTerminalCwd(terminal);
    if (!cwd) {
      return false;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return false;
    }

    // CWD가 workspace 폴더 중 하나에 속하는지 확인
    return workspaceFolders.some(folder => {
      const folderPath = folder.uri.fsPath;
      return cwd.startsWith(folderPath);
    });
  }

  /**
   * 현재 workspace의 모든 터미널 찾기
   */
  static async getWorkspaceTerminals(): Promise<vscode.Terminal[]> {
    const allTerminals = vscode.window.terminals;
    const workspaceTerminals: vscode.Terminal[] = [];

    for (const terminal of allTerminals) {
      const isInWorkspace = await this.isTerminalInCurrentWorkspace(terminal);
      if (isInWorkspace) {
        workspaceTerminals.push(terminal);
      }
    }

    return workspaceTerminals;
  }

  /**
   * 터미널 이름으로 Claude Code 터미널 감지
   * Claude Code는 보통 특정 패턴의 이름을 사용
   */
  static isClaudeCodeTerminal(terminal: vscode.Terminal): boolean {
    const name = terminal.name.toLowerCase();

    // Claude Code 터미널 패턴
    return name.includes('claude') ||
           name.includes('node') ||
           name.includes('uvx') ||
           name.includes('python');
  }

  /**
   * 디버그: 모든 터미널 정보 출력
   */
  static async debugAllTerminals(): Promise<void> {
    const terminals = vscode.window.terminals;
    console.log('\n=== Terminal Debug Info ===');
    console.log(`Total terminals: ${terminals.length}`);

    for (const terminal of terminals) {
      const processId = await terminal.processId;
      const cwd = await this.getTerminalCwd(terminal);
      const inWorkspace = await this.isTerminalInCurrentWorkspace(terminal);

      console.log(`\nTerminal: ${terminal.name}`);
      console.log(`  Process ID: ${processId}`);
      console.log(`  CWD: ${cwd || 'unknown'}`);
      console.log(`  In Workspace: ${inWorkspace}`);
    }
    console.log('=========================\n');
  }
}
