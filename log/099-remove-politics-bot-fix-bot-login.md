# 099 - 정치봇 완전 제거 + BOT 로그인 수정 + 주식봇 수동 테스트 스크립트

## 변경 사항

### 1. BOT 로그인 차단 로직 리버트

**파일**: `backend/src/services/authService.ts`, `backend/src/services/authService.test.ts`

**문제**: 이전 커밋에서 BOT role 사용자의 로그인을 차단하는 로직을 추가했으나, 봇 서비스가 동일한 `/auth/login` 엔드포인트로 인증하므로 봇 서비스 자체가 작동 불가

**수정**:
- `authService.ts`에서 BOT 로그인 차단 코드 제거
- 테스트를 `throws ForbiddenError when user is BOT` → `allows BOT users to login successfully`로 변경

### 2. 정치봇 완전 제거

**삭제된 파일**:
- `bot/src/bots/politicsBot.ts`
- `bot/src/bots/politicsBot.test.ts`

**수정된 파일**:
- `bot/src/bots/baseBot.ts` — BotType에서 'politics' 제거
- `bot/src/services/openaiService.ts` — BotType에서 'politics' 제거, promptMap에서 politics 제거
- `bot/src/services/openaiService.test.ts` — politics 관련 테스트 제거/수정
- `bot/src/config/prompts.ts` — politicsPost, politicsReply 프롬프트 제거
- `bot/src/config/environment.ts` — bots.politics 설정 제거
- `bot/src/scheduler.ts` — politicsBot import/client/cron 작업 제거 (3→2 봇)
- `bot/src/scheduler.test.ts` — 3→2 봇 기준으로 테스트 수정
- `bot/src/webhook/commentReplyHandler.ts` — politics 봇 클라이언트 초기화 제거
- `bot/src/webhook/__tests__/commentReplyHandler.test.ts` — politics → news로 변경
- `bot/src/services/naverNewsService.ts` — getPoliticalNews 함수 제거
- `bot/src/services/naverNewsService.test.ts` — getPoliticalNews import/테스트 제거
- `bot/.env.example` — BOT_POLITICS_USERNAME/PASSWORD 제거

### 3. 주식봇 수동 테스트 스크립트 추가

**새 파일**: `bot/scripts/testStockBot.ts`

단계별 실행 가능한 CLI 스크립트:
- `--step login` : Kimitter API 로그인만 테스트
- `--step kis` : 한국투자증권 API 인증 + 거래량 순위 조회
- `--step generate` : OpenAI로 글 생성까지 (게시 안 함)
- `--step post` : 실제 게시까지 전체 플로우 (기본값)

## 테스트 결과

- **Backend**: 11 suites, 64 tests 전부 통과 / tsc clean
- **Bot**: 9 suites, 76 tests 전부 통과 / tsc clean

## NAS 추가 작업

- `politicsbot` DB 계정 비활성화 필요 (관리자 앱에서 또는 직접 DB에서)
- 봇 Docker 이미지 재빌드 & push 필요
