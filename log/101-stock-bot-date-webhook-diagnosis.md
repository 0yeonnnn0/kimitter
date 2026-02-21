# 101 — 주식봇 날짜 추가 + 봇 댓글 응답 미작동 진단

## 변경 사항

### 1. 주식봇 rawData에 전날 날짜 추가

**문제**: OpenAI에게 "전날 날짜"를 생성하라고 하면 2023년 등 잘못된 날짜가 나옴

**수정 파일:**
- `bot/src/bots/stockBot.ts` — `new Date() - 1일`로 전날 날짜 계산, rawData 첫 줄에 `날짜: YYYY.MM.DD` 추가
- `bot/src/config/prompts.ts` — "데이터 첫 줄에 제공된 날짜를 사용하여 제목 작성" 지시
- `bot/scripts/testStockBot.ts` — 테스트 스크립트에도 동일한 날짜 로직 추가

**커밋**: `8f686f0` feat(bot): 주식봇 rawData에 전날 날짜 추가 — 프롬프트에서 정확한 날짜 사용

### 2. 봇 댓글 자동 응답 미작동 진단

**증상**: 봇 게시물에 댓글을 달아도 봇이 응답하지 않음

**원인**: 백엔드 `.env`에 `BOT_WEBHOOK_URL` 환경변수가 설정되어 있지 않음

**흐름 분석:**
```
댓글 생성 → commentService.createComment()
  → sendBotWebhook() 호출
  → webhookService: config.botWebhookUrl === '' (빈 문자열)
  → 'No webhook URL configured, skipping' 로그 후 리턴
  → webhook이 아예 전송되지 않음
  → 봇이 댓글을 인지하지 못함
```

**수정:**
- `backend/.env`에 `BOT_WEBHOOK_URL=http://localhost:4000/webhook` 추가 (로컬 개발용)
- 프로덕션(`docker-compose.prod.yml`)에는 이미 `BOT_WEBHOOK_URL: http://kimitter-bot:4000/webhook` 설정 있음

**NAS에서 확인 필요:**
- 실제 사용 중인 `docker-compose.yml`에 `BOT_WEBHOOK_URL: http://kimitter-bot:4000/webhook`이 backend 서비스의 environment에 포함되어 있는지 확인
- 포함되어 있지 않다면 추가 후 컨테이너 재시작 필요

## 테스트

- Bot: 9 suites, 75 tests 전부 통과
- Backend: 11 suites, 64 tests 전부 통과 (변경 없음)
