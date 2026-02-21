/**
 * 주식봇 수동 테스트 스크립트
 *
 * 사용법:
 *   cd bot
 *   npx ts-node scripts/testStockBot.ts
 *
 * 필요한 환경변수 (.env):
 *   KIMITTER_API_URL    — 백엔드 API URL (e.g. https://kimitter.yeonnnn.xyz/api)
 *   BOT_STOCK_USERNAME  — 주식봇 계정 (e.g. stockbot)
 *   BOT_STOCK_PASSWORD  — 주식봇 비밀번호 (e.g. stockbot1234)
 *   KIS_APP_KEY         — 한국투자증권 App Key
 *   KIS_APP_SECRET      — 한국투자증권 App Secret
 *   OPENAI_API_KEY      — OpenAI API Key
 *
 * 단계별 실행:
 *   --step login     : 로그인만 테스트
 *   --step kis       : KIS API 인증 + 거래량 순위 조회
 *   --step generate  : OpenAI 글 생성까지 (게시 안 함)
 *   --step post      : 실제 게시까지 전체 플로우 (기본값)
 */

import dotenv from 'dotenv';
dotenv.config();

import { config } from '../src/config/environment';
import { KimitterClient } from '../src/api/kimitterClient';
import { KisStockService } from '../src/services/kisStockService';
import { generatePostContent } from '../src/services/openaiService';

const DIVIDER = '─'.repeat(50);

async function stepLogin(): Promise<KimitterClient> {
  console.log('\n📌 Step 1: 로그인 테스트');
  console.log(DIVIDER);
  console.log(`  API URL  : ${config.kimitter.apiUrl}`);
  console.log(`  Username : ${config.bots.stock.username}`);

  const client = new KimitterClient({
    apiUrl: config.kimitter.apiUrl,
    username: config.bots.stock.username,
    password: config.bots.stock.password,
  });

  await client.login();
  console.log('  ✅ 로그인 성공');
  return client;
}

async function stepKis(): Promise<{
  name: string;
  rawData: string;
} | null> {
  console.log('\n📌 Step 2: KIS API — 거래량 상위 종목 조회');
  console.log(DIVIDER);
  console.log(`  KIS Base URL : ${config.kis.baseUrl}`);
  console.log(`  App Key      : ${config.kis.appKey ? config.kis.appKey.slice(0, 8) + '...' : '(empty)'}`);

  if (!config.kis.appKey || !config.kis.appSecret) {
    console.log('  ❌ KIS_APP_KEY / KIS_APP_SECRET 환경변수가 없습니다.');
    return null;
  }

  const stockService = new KisStockService();

  console.log('  → KIS OAuth 인증 중...');
  await stockService.authenticate();
  console.log('  ✅ KIS 인증 성공');

  console.log('  → 거래량 상위 5개 종목 조회 중...');
  const trending = await stockService.getTrendingStocks(5);

  if (trending.length === 0) {
    console.log('  ⚠️  거래량 순위 데이터 없음 (장 마감 시간대일 수 있음)');
    return null;
  }

  console.log(`  ✅ ${trending.length}개 종목 조회 완료:\n`);
  for (const stock of trending) {
    const sign = stock.changeRate > 0 ? '▲' : stock.changeRate < 0 ? '▼' : '─';
    console.log(
      `     ${stock.rank}. ${stock.name} (${stock.ticker})` +
        ` | ₩${stock.currentPrice.toLocaleString()}` +
        ` | ${sign} ${Math.abs(stock.changeRate)}%` +
        ` | 거래량 ${stock.volume.toLocaleString()}`,
    );
  }

  const topStock = trending[0];
  console.log(`\n  → 1위 종목 상세 조회: ${topStock.name} (${topStock.ticker})`);
  const detail = await stockService.getStockPrice(topStock.ticker);

  if (!detail) {
    console.log('  ⚠️  종목 상세 조회 실패');
    return null;
  }

  const rawData = `종목명: ${detail.name}
현재가: ₩${detail.currentPrice.toLocaleString()}
전일대비: ${detail.changeRate > 0 ? '+' : ''}${detail.changeRate}%
거래량: ${detail.volume.toLocaleString()}
거래량 순위: ${topStock.rank}`;

  console.log('  ✅ 종목 상세 조회 성공');
  return { name: detail.name, rawData };
}

async function stepGenerate(rawData: string): Promise<string | null> {
  console.log('\n📌 Step 3: OpenAI — 게시글 생성');
  console.log(DIVIDER);
  console.log(`  Model : ${config.openai.model}`);
  console.log(`  API Key : ${config.openai.apiKey ? config.openai.apiKey.slice(0, 8) + '...' : '(empty)'}`);

  if (!config.openai.apiKey) {
    console.log('  ❌ OPENAI_API_KEY 환경변수가 없습니다.');
    return null;
  }

  console.log('  → 원본 데이터:');
  console.log(`     ${rawData.replace(/\n/g, '\n     ')}`);
  console.log('  → 글 생성 중...');

  const content = await generatePostContent('stock', rawData);

  if (!content) {
    console.log('  ❌ OpenAI가 null을 반환했습니다.');
    return null;
  }

  console.log('  ✅ 글 생성 완료:\n');
  console.log(`     ${content.replace(/\n/g, '\n     ')}`);
  return content;
}

async function stepPost(client: KimitterClient, content: string, stockName: string): Promise<void> {
  console.log('\n📌 Step 4: Kimitter에 게시');
  console.log(DIVIDER);

  const tags = ['주식', '경제', stockName];
  console.log(`  Tags : ${tags.join(', ')}`);
  console.log('  → 게시 중...');

  await client.createPost(content, tags);
  console.log('  ✅ 게시 완료!');
}

async function main(): Promise<void> {
  const step = process.argv.find((a) => a.startsWith('--step='))?.split('=')[1]
    || process.argv[process.argv.indexOf('--step') + 1]
    || 'post';

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║          🤖 주식봇 수동 테스트                    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  실행 모드: --step ${step}`);

  try {
    // Step 1: Login
    const client = await stepLogin();
    if (step === 'login') {
      console.log('\n🏁 로그인 테스트 완료');
      return;
    }

    // Step 2: KIS API
    const stockResult = await stepKis();
    if (step === 'kis') {
      console.log('\n🏁 KIS API 테스트 완료');
      return;
    }
    if (!stockResult) {
      console.log('\n❌ KIS 데이터 없음 — 이후 단계 중단');
      return;
    }

    // Step 3: OpenAI
    const content = await stepGenerate(stockResult.rawData);
    if (step === 'generate') {
      console.log('\n🏁 글 생성 테스트 완료 (게시 안 함)');
      return;
    }
    if (!content) {
      console.log('\n❌ 글 생성 실패 — 게시 중단');
      return;
    }

    // Step 4: Post
    await stepPost(client, content, stockResult.name);
    console.log('\n🏁 전체 플로우 완료!');
  } catch (error) {
    console.error('\n❌ 에러 발생:', error);
    process.exit(1);
  }
}

main();
