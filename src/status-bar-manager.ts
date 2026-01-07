import * as vscode from 'vscode';

/**
 * Status Bar 관리자
 * 큐에 대기 중인 터미널 개수를 표시하고 클릭 시 다음 터미널로 이동
 */
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    // Status Bar 아이템 생성 (왼쪽 정렬, 우선순위 100)
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );

    // 클릭 시 실행할 명령어 설정
    this.statusBarItem.command = 'claude-terminal-queue.nextInQueue';

    // 초기에는 숨김
    this.statusBarItem.hide();
  }

  /**
   * 큐 개수 업데이트
   */
  public updateQueueCount(count: number): void {
    if (count === 0) {
      // 큐가 비어있으면 숨김
      this.statusBarItem.hide();
    } else {
      // 큐에 항목이 있으면 표시
      // Claude Code 스타일: 대화 아이콘 + 오렌지/코랄 색상
      this.statusBarItem.text = `$(comment-discussion) Claude 입력 대기: ${count}`;
      this.statusBarItem.tooltip = `Claude Code가 응답을 기다리고 있습니다\n클릭 또는 Ctrl+Shift+I로 터미널로 이동\n대기 중: ${count}개`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      this.statusBarItem.show();

      console.log(`[StatusBar] 업데이트: ${count}개 대기 중`);
    }
  }

  /**
   * 처리 중 상태 표시
   */
  public showProcessing(): void {
    this.statusBarItem.text = `$(sync~spin) 처리 중...`;
    this.statusBarItem.tooltip = '입력 처리 중...';
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    this.statusBarItem.show();
  }

  /**
   * 수동으로 숨김
   */
  public hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * 수동으로 표시
   */
  public show(): void {
    this.statusBarItem.show();
  }

  /**
   * 정리
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
