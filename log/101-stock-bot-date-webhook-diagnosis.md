# 101 — 주식봇 날짜 추가 + 봇 댓글 응답 수정

## 변경 사항

### 1. 주식봇 rawData에 전날 날짜 추가

**문제**: OpenAI에게 "전날 날짜"를 생성하라고 하면 2023년 등 잘못된 날짜가 나옴

**수정 파일:**
- `bot/src/bots/stockBot.ts` — `new Date() - 1일`로 전날 날짜 계산, rawData 첫 줄에 `날짜: YYYY.MM.DD` 추가
- `bot/src/config/prompts.ts` — "데이터 첫 줄에 제공된 날짜를 사용하여 제목 작성" 지시
- `bot/scripts/testStockBot.ts` — 테스트 스크립트에도 동일한 날짜 로직 추가

**커밋**: `8f686f0` feat(bot): 주식봇 rawData에 전날 날짜 추가 — 프롬프트에서 정확한 날짜 사용

### 2. 봇 댓글 자동 응답 수정

**증상**: 봇 게시물에 댓글을 달아도 봇이 응답하지 않음

**원인 1 (로컬)**: 백엔드 `.env`에 `BOT_WEBHOOK_URL` 환경변수 미설정
- `webhookService`에서 URL이 빈 문자열이면 `'No webhook URL configured, skipping'`으로 스킵
- `backend/.env`에 `BOT_WEBHOOK_URL=http://localhost:4000/webhook` 추가

**원인 2 (코드 버그)**: `bot/src/index.ts`에서 `initializeBotClients()` 호출 누락
- `scheduler.initialize()`는 스케줄러 전용 클라이언트를 생성
- `commentReplyHandler.ts`의 `botClients` Map은 별도로 존재하는데, `initializeBotClients()`를 아무도 호출하지 않아 항상 빈 Map
- webhook 수신 → `getBotTypeByPostId()` → 빈 Map 순회 → `null` 반환 → `"Post X not owned by any bot, skipping reply"`

**수정:**
- `bot/src/index.ts`에 `import { initializeBotClients }` + `await initializeBotClients()` 추가
- `backend/.env`에 `BOT_WEBHOOK_URL=http://localhost:4000/webhook` 추가

**커밋**: `9941317` fix(bot): webhook 댓글 응답 수정 — initializeBotClients() 호출 누락

## 테스트

- Bot: 9 suites, 75 tests 전부 통과
- Backend: 11 suites, 64 tests 전부 통과 (변경 없음)
