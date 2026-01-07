/**
 * 터미널 제목 변경 테스트
 *
 * 이 스크립트는 터미널 제목을 동적으로 변경하는 기능을 테스트합니다.
 * - ANSI escape sequence를 사용하여 터미널 탭 제목 변경
 * - 사용자 입력 대기 상태 표시
 * - 포커스/입력 시 자동 복구
 */

import * as readline from 'readline';

class TerminalTitleManager {
  private originalTitle: string;
  private isWaitingInput: boolean = false;

  constructor(title: string = 'Claude Code') {
    this.originalTitle = title;
    this.setTitle(title);
  }

  /**
   * 터미널 제목 설정
   * ANSI escape sequence: \x1b]0;제목\x07
   */
  private setTitle(title: string): void {
    process.stdout.write(`\x1b]0;${title}\x07`);
  }

  /**
   * 사용자 입력 대기 상태로 변경
   */
  waitingForInput(): void {
    this.isWaitingInput = true;
    this.setTitle(`${this.originalTitle} ⚠️`);
    console.log('\n🔔 사용자 입력 대기 중... (터미널 제목 확인!)');
  }

  /**
   * 처리 중 상태로 변경
   */
  processing(): void {
    this.isWaitingInput = false;
    this.setTitle(`${this.originalTitle} ⏳`);
    console.log('⏳ 처리 중...');
  }

  /**
   * 정상 상태로 복구
   */
  idle(): void {
    this.isWaitingInput = false;
    this.setTitle(this.originalTitle);
    console.log('✅ 정상 상태로 복구');
  }

  /**
   * 에러 상태
   */
  error(): void {
    this.setTitle(`${this.originalTitle} ❌`);
    console.log('❌ 에러 발생');
  }

  getOriginalTitle(): string {
    return this.originalTitle;
  }

  isWaiting(): boolean {
    return this.isWaitingInput;
  }
}

/**
 * 사용자 입력을 받는 함수
 */
function getUserInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * 딜레이 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 메인 테스트 시나리오
 */
async function main() {
  console.clear();
  console.log('='.repeat(50));
  console.log('터미널 제목 변경 테스트');
  console.log('='.repeat(50));
  console.log('\n🎯 테스트 목표:');
  console.log('1. 터미널 탭 제목이 "Claude Code ⚠️"로 변경되는지 확인');
  console.log('2. 사용자 입력 시 원래 제목으로 복구되는지 확인\n');

  const titleManager = new TerminalTitleManager('Claude Code');

  // 시나리오 1: 정상 → 처리 중 → 입력 대기
  console.log('\n📝 시나리오 1: 상태 변경 테스트');
  console.log('━'.repeat(50));

  await delay(1000);
  titleManager.processing();
  await delay(2000);

  titleManager.waitingForInput();
  console.log('\n👆 위를 보세요! 터미널 탭 제목이 "Claude Code ⚠️"로 변경되었나요?');

  // 사용자 입력 대기
  await getUserInput('\n아무 키나 입력하고 Enter를 누르세요: ');

  // 입력 받으면 즉시 복구
  titleManager.idle();
  console.log('\n✅ 입력 감지! 제목이 "Claude Code"로 복구되었나요?');

  await delay(2000);

  // 시나리오 2: 반복 테스트
  console.log('\n\n📝 시나리오 2: 반복 테스트');
  console.log('━'.repeat(50));

  for (let i = 1; i <= 3; i++) {
    console.log(`\n[${i}/3] 테스트 진행 중...`);
    titleManager.processing();
    await delay(1000);

    titleManager.waitingForInput();
    await getUserInput(`질문 ${i}: 좋아하는 색은? `);

    titleManager.idle();
    console.log(`답변 ${i} 저장됨!`);
    await delay(500);
  }

  // 시나리오 3: 에러 상태 테스트
  console.log('\n\n📝 시나리오 3: 에러 상태 테스트');
  console.log('━'.repeat(50));

  titleManager.error();
  await delay(2000);

  titleManager.idle();

  // 종료
  console.log('\n\n' + '='.repeat(50));
  console.log('🎉 테스트 완료!');
  console.log('='.repeat(50));
  console.log('\n결과 확인:');
  console.log('✅ 터미널 제목이 상태에 따라 변경되었나요?');
  console.log('✅ 입력 시 즉시 원래 제목으로 복구되었나요?');
  console.log('✅ 이모지가 제목 뒤에 잘 표시되었나요?\n');
}

// 프로그램 실행
main().catch((error) => {
  console.error('에러 발생:', error);
  process.exit(1);
});
