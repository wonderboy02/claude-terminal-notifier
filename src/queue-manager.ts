import * as vscode from 'vscode';

/**
 * 터미널 입력 요청 아이템
 */
export interface TerminalInputRequest {
  terminal: vscode.Terminal;
  question: string;
  timestamp: number;
}

/**
 * 터미널 입력 요청 큐 관리자
 * FIFO (First In First Out) 방식으로 관리
 */
export class TerminalQueueManager {
  private queue: TerminalInputRequest[] = [];
  private onQueueChangedEmitter = new vscode.EventEmitter<number>();

  /**
   * 큐 변경 이벤트
   * 구독자는 현재 큐 길이를 받음
   */
  public readonly onQueueChanged = this.onQueueChangedEmitter.event;

  /**
   * 새로운 입력 요청을 큐에 추가
   */
  public enqueue(terminal: vscode.Terminal, question: string = '입력이 필요합니다'): void {
    const request: TerminalInputRequest = {
      terminal,
      question,
      timestamp: Date.now()
    };

    this.queue.push(request);
    console.log(`[Queue] 추가됨: ${terminal.name} - "${question}" (총 ${this.queue.length}개)`);

    // 이벤트 발생
    this.onQueueChangedEmitter.fire(this.queue.length);
  }

  /**
   * 큐에서 다음 요청을 꺼내서 반환 (제거는 하지 않음)
   */
  public peek(): TerminalInputRequest | undefined {
    return this.queue[0];
  }

  /**
   * 큐에서 다음 요청을 꺼내고 제거
   */
  public dequeue(): TerminalInputRequest | undefined {
    const request = this.queue.shift();

    if (request) {
      console.log(`[Queue] 처리됨: ${request.terminal.name} - "${request.question}" (남은 개수: ${this.queue.length})`);
    }

    // 이벤트 발생
    this.onQueueChangedEmitter.fire(this.queue.length);

    return request;
  }

  /**
   * 특정 터미널의 요청 제거
   */
  public remove(terminal: vscode.Terminal): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(req => req.terminal !== terminal);

    const removed = initialLength !== this.queue.length;
    if (removed) {
      console.log(`[Queue] 제거됨: ${terminal.name} (남은 개수: ${this.queue.length})`);
      this.onQueueChangedEmitter.fire(this.queue.length);
    }

    return removed;
  }

  /**
   * 큐 전체 비우기
   */
  public clear(): void {
    const count = this.queue.length;
    this.queue = [];

    if (count > 0) {
      console.log(`[Queue] 전체 삭제: ${count}개 삭제됨`);
      this.onQueueChangedEmitter.fire(0);
    }
  }

  /**
   * 현재 큐 길이
   */
  public get length(): number {
    return this.queue.length;
  }

  /**
   * 큐가 비어있는지 확인
   */
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * 큐에 있는 모든 요청 반환 (읽기 전용)
   */
  public getAll(): readonly TerminalInputRequest[] {
    return [...this.queue];
  }

  /**
   * 디버그용: 큐 상태 출력
   */
  public debug(): void {
    console.log('\n=== Queue Status ===');
    console.log(`Total: ${this.queue.length}`);
    this.queue.forEach((req, index) => {
      const age = Math.floor((Date.now() - req.timestamp) / 1000);
      console.log(`${index + 1}. ${req.terminal.name} - "${req.question}" (${age}초 전)`);
    });
    console.log('===================\n');
  }

  /**
   * 정리
   */
  public dispose(): void {
    this.queue = [];
    this.onQueueChangedEmitter.dispose();
  }
}
