# 2026-02-13: Bot System 구현 진행 상황

## 개요

Kimitter 가족 SNS에 3개의 자동 봇(주식/정치/뉴스)을 **완전히 별도의 외부 서비스**로 구축하는 작업. 총 12개 태스크를 4개 Wave로 나누어 병렬 실행 중.

- **플랜 파일**: `.sisyphus/plans/bot-system.md`
- **진행률**: Wave 1-4 완료 (12/12 태스크 완료) ✅

---

## 커밋 이력

| 순서 | 커밋 해시 | 메시지 | Wave/Task |
|------|-----------|--------|-----------|
| 1 | `c15dc7f` | feat(backend): add BOT role to schema with login block and notification suppression | Wave 1 / Task 1 |
| 2 | `3cfd11e` | feat(bot): scaffold bot service with Kimitter API client | Wave 1 / Task 2 |
| 3 | `f5ed0b1` | feat(frontend): add BOT role type and badge component | Wave 1 / Task 3 |
| 4 | `a5a9eac` | feat(bot): add OpenAI service with Korean prompt templates | Wave 2 / Task 4 |
| 5 | `14acecd` | feat(bot): add Naver News API client | Wave 2 / Task 5 |
| 6 | `ce7a782` | feat(bot): add KIS stock API client | Wave 2 / Task 6 |
| 7 | `2055273` | feat(backend): add webhook dispatch for bot post comments | Wave 2 / Task 7 |
| 8 | `bf0e69c` | feat(bot): implement stock, politics, and news bots | Wave 3 / Task 8 |
| 9 | `7ca274c` | feat(bot): add webhook receiver and comment reply handler | Wave 3 / Task 9 |
| 10 | `f3fdee5` | feat(bot): add scheduler, index entry point, and seed script | Wave 3 / Task 10 |
| 11 | `dc27ccb` | feat(bot): add Dockerfile and docker-compose for bot service | Wave 4 / Task 11 |

---

## Wave 1 — 완료 ✅

### Task 1: Backend BOT role 추가 (`c15dc7f`)

**수정 파일:**
- `backend/prisma/schema.prisma` — Role enum에 `BOT` 추가
- `backend/prisma/migrations/` — `add-bot-role` migration 생성
- `backend/src/services/authService.ts` — BOT role 로그인 차단 (ForbiddenError)
- `backend/src/services/notificationService.ts` — BOT recipient 알림 억제
- `backend/src/middleware/adminValidation.ts` — updateRoleSchema에 'BOT' 추가
- 관련 테스트 파일 추가

**검증:**
- `npm test` — 52 passed (1 suite failed: pre-existing postService.test.ts 이슈, BOT role과 무관)
- `npx tsc --noEmit` — 에러 없음

---

### Task 2: Bot Service 스캐폴드 + Kimitter API 클라이언트 (`3cfd11e`)

**생성 파일:**
- `bot/package.json` — 의존성: axios, express, node-cron, openai, winston
- `bot/tsconfig.json` — strict mode, ES2020 target
- `bot/jest.config.ts` — ts-jest preset
- `bot/.env.example` — 전체 환경변수 템플릿
- `bot/src/config/environment.ts` — 환경변수 관리 (Kimitter API, OpenAI, Naver, KIS)
- `bot/src/api/kimitterClient.ts` — Kimitter HTTP API 클라이언트
  - login, refreshAccessToken, createPost, createComment, createReply, getComments, getMyPosts
  - 401 응답 시 자동 토큰 갱신
- `bot/src/utils/logger.ts` — Winston 로거
- `bot/src/utils/retry.ts` — exponential backoff retry 유틸
- 빈 디렉토리: `bot/src/services/`, `bot/src/bots/`, `bot/src/webhook/`

**검증:**
- `npm test` — 11 passed
- `npx tsc --noEmit` — 에러 없음

---

### Task 3: Frontend BOT role 타입 + 뱃지 컴포넌트 (`f5ed0b1`)

**수정/생성 파일:**
- `frontend/src/types/models.ts`
  - `User.role` 타입에 `'BOT'` 추가 (`'USER' | 'ADMIN' | 'BOT'`)
  - `Post.user`, `Comment.user`, `Schedule.user` Pick 타입에 `'role'` 필드 추가
- `frontend/src/components/BotBadge.tsx` (신규)
  - `size` prop: `'small'` (인라인) / `'normal'` (프로필)
  - 보라색 배경 (`#5856D6`), 흰색 'BOT' 텍스트
- `frontend/src/components/PostCard.tsx` — 닉네임 옆 봇 뱃지 조건부 렌더링
- `frontend/app/[postId]/index.tsx` — 게시글 상세/댓글/대댓글에 봇 뱃지 추가
- `frontend/app/user/[userId].tsx` — 타 유저 프로필에 봇 뱃지 추가
- `frontend/app/(tabs)/profile.tsx` — 내 프로필에 봇 뱃지 추가

**검증:**
- `npx tsc --noEmit` — 에러 없음

---

## Wave 2 — 완료 ✅

### Task 4: OpenAI 서비스 + 프롬프트 템플릿 (`a5a9eac`)

**생성 파일:**
- `bot/src/services/openaiService.ts` — GPT-4o-mini 클라이언트
  - `generatePostContent(type, rawData)` → 게시글 콘텐츠 생성
  - `generateCommentReply(botType, postContent, thread, comment)` → 댓글 답변
  - 에러 핸들링: API 실패 시 null 반환 (graceful)
  - 토큰 사용량 로깅
- `bot/src/config/prompts.ts` — 한국어 프롬프트 템플릿
  - 주식봇 📊 / 정치봇 🏛️ / 뉴스봇 📰 게시글 프롬프트
  - 댓글 답변 프롬프트 (봇 성격별 톤)
- `bot/src/services/openaiService.test.ts` — 8 테스트

**검증:**
- `npm test` — 8 tests passed
- `npx tsc --noEmit` — 에러 없음

---

### Task 5: Naver News API 클라이언트 (`14acecd`)

**생성 파일:**
- `bot/src/services/naverNewsService.ts`
  - `searchNews(query, display)` — Naver News API 검색
  - `stripHtmlTags(text)` — HTML 태그 제거
  - `filterRecentNews(items, hoursAgo)` — 24시간 내 뉴스 필터링
  - `getPoliticalNews()` — 정치 뉴스 (최대 10건)
  - `getGeneralNews()` — 일반 뉴스 (정치/주식 키워드 제외, 최대 10건)
- `bot/src/services/naverNewsService.test.ts` — 16 테스트

**검증:**
- `npm test` — 16 tests passed
- `npx tsc --noEmit` — 에러 없음

---

### Task 6: KIS 주식 API 클라이언트 (`ce7a782`)

**생성 파일:**
- `bot/src/services/kisStockService.ts`
  - `KisStockService` 클래스
  - `authenticate()` — OAuth2 토큰 관리
  - `getStockPrice(ticker)` — 종목 현재가 조회 (tr_id: FHKST01010100)
  - `getTrendingStocks(count)` — 거래량 상위 종목 (tr_id: FHPST01710000)
  - 토큰 만료 시 자동 재인증
- `bot/src/services/kisStockService.test.ts` — 12 테스트

**검증:**
- `npm test` — 12 tests passed
- `npx tsc --noEmit` — 에러 없음

---

### Task 7: Backend 웹훅 발송 로직 (`2055273`)

**수정/생성 파일:**
- `backend/src/services/webhookService.ts` (신규) — 웹훅 디스패치 서비스
  - `sendBotWebhook(payload)` — 봇 서비스에 HTTP POST (fire-and-forget)
  - BOT_WEBHOOK_URL 미설정 시 안전하게 스킵
- `backend/src/services/commentService.ts` — createComment, createReply에 웹훅 발송 추가
  - 조건: postAuthor.role === 'BOT' && commentAuthor.role !== 'BOT'
- `backend/src/config/environment.ts` — BOT_WEBHOOK_URL 추가
- `backend/.env.example` — BOT_WEBHOOK_URL 추가
- `backend/src/services/webhookService.test.ts` — 3 테스트
- `backend/src/services/commentService.test.ts` — 9 테스트 추가

**검증:**
- `npm test` — 55 tests passed (1 pre-existing suite failure: postService.test.ts)
- `npx tsc --noEmit` — 에러 없음

---

## Wave 3 — 완료 ✅

### Task 8: 3개 봇 구현 (`bf0e69c`)

**생성 파일:**
- `bot/src/bots/baseBot.ts` — 공통 타입 + `hasPostedToday` 중복 게시 방지
- `bot/src/bots/stockBot.ts` — 주식봇 (KIS API → 트렌딩 종목 → AI 요약 → 게시)
- `bot/src/bots/politicsBot.ts` — 정치봇 (Naver News 정치 → AI 요약 → 게시)
- `bot/src/bots/newsBot.ts` — 뉴스봇 (Naver News 일반 → AI 요약 → 게시)
- `bot/src/bots/stockBot.test.ts` — 7 테스트
- `bot/src/bots/politicsBot.test.ts` — 6 테스트
- `bot/src/bots/newsBot.test.ts` — 6 테스트

**주요 기능:**
- 중복 게시 방지: `hasPostedToday()` — 오늘 이미 게시했으면 스킵
- 외부 API 실패 시 graceful 스킵 (로그만 남기고 서버 유지)
- 태그: 주식 `['주식', '경제', 기업명]`, 정치 `['정치', '뉴스']`, 뉴스 `['뉴스', 카테고리명]`

**검증:**
- `npm test` — 19 new tests passed
- `npx tsc --noEmit` — 에러 없음

---

### Task 9: 웹훅 수신 서버 + 댓글 답변 (`7ca274c`)

**생성 파일:**
- `bot/src/webhook/webhookServer.ts` — Express 웹훅 서버 (port 4000)
  - `POST /webhook` — 백엔드로부터 댓글 알림 수신
  - `GET /health` — 헬스체크
  - Payload 검증 (postId, commentId, commentContent, commentAuthor 필수)
- `bot/src/webhook/commentReplyHandler.ts` — 댓글 답변 로직
  - BOT→BOT 방지 (봇 댓글에는 응답 안 함)
  - 봇 타입 판별 (postId로 어떤 봇의 게시글인지 확인)
  - AI 답변 생성 → Kimitter API로 reply 작성
  - 에러 시 graceful 스킵
- `bot/src/webhook/__tests__/webhookServer.test.ts` — 5 테스트
- `bot/src/webhook/__tests__/commentReplyHandler.test.ts` — 9 테스트

**검증:**
- `npm test` — 14 new tests passed
- `npx tsc --noEmit` — 에러 없음

---

### Task 10: 스케줄러 + 봇 계정 seed 스크립트 (`f3fdee5`)

**생성 파일:**
- `bot/src/scheduler.ts` — node-cron 스케줄러
  - 정치봇: `'0 8 * * *'` (매일 8:00 KST)
  - 뉴스봇: `'1 8 * * *'` (매일 8:01 KST)
  - 주식봇: `'2 8 * * 1'` (매주 월요일 8:02 KST)
  - BOT_ENABLED=false면 스케줄 미등록
  - Graceful stop 지원
- `bot/src/index.ts` — 메인 진입점
  - scheduler.initialize() → createWebhookServer() → scheduler.start()
- `bot/scripts/seedBotUsers.ts` — 봇 계정 생성 스크립트
  - username: `stock-bot`, `politics-bot`, `news-bot`
  - nickname: `📊 주식봇`, `🏛️ 정치봇`, `📰 뉴스봇`
  - role: BOT, 랜덤 64자 비밀번호
- `bot/src/scheduler.test.ts` — 5 테스트

**검증:**
- `npm test` — 5 new tests passed
- `npx tsc --noEmit` — 에러 없음

---

## Wave 4 — 완료 ✅

### Task 11: Dockerfile + docker-compose (`dc27ccb`)

**생성 파일:**
- `bot/Dockerfile` — Multi-stage build (node:20-slim)
  - Build stage: TypeScript 컴파일
  - Production stage: dist/ + node_modules만 포함
  - EXPOSE 4000, CMD `["node", "dist/index.js"]`
- `bot/.dockerignore` — node_modules, dist, .env 제외
- `bot/docker-compose.yml` — kimitter-net 외부 네트워크, .env 파일 참조, restart: unless-stopped

**검증:**
- `docker build -t kimitter-bot .` — 빌드 성공 ✅

---

### Task 12: 통합 테스트 — 전체 플로우 검증

**검증 결과:**
- `npm test` (backend) — 55/55 tests passed ✅ (1 pre-existing suite failure: postService.test.ts — BOT 작업과 무관)
- `npm test` (bot) — 85/85 tests passed ✅
- `npx tsc --noEmit` (backend) — 에러 없음 ✅
- `npx tsc --noEmit` (bot) — 에러 없음 ✅
- `npx tsc --noEmit` (frontend) — 에러 없음 ✅
- `npm run build` (backend) — 빌드 성공 ✅
- `docker build -t kimitter-bot .` (bot) — Docker 빌드 성공 ✅

---

## 아키텍처 요약

```
┌──────────────────┐     HTTP API      ┌──────────────────┐
│                  │ ──────────────────▶│                  │
│   Bot Service    │     (게시/댓글)     │   Kimitter       │
│   (bot/)         │ ◀──────────────── │   Backend        │
│                  │     Webhook        │   (backend/)     │
│  - 주식봇 (주1회) │   (댓글 알림)      │                  │
│  - 정치봇 (일1회) │                   │   PostgreSQL     │
│  - 뉴스봇 (일1회) │                   │   (Prisma ORM)   │
│                  │                   │                  │
│  External APIs:  │                   │                  │
│  - OpenAI        │                   └──────────────────┘
│  - Naver News    │                          ▲
│  - KIS Stock     │                          │
└──────────────────┘                   ┌──────────────────┐
                                       │   Frontend       │
                                       │   (frontend/)    │
                                       │   React Native   │
                                       │   + BOT 뱃지 UI  │
                                       └──────────────────┘
```

---

## 제약 사항 (Guardrails)

- ❌ 관리자 봇 제어 UI/API (환경변수만)
- ❌ 봇 간 상호작용 (봇끼리 댓글 주고받기)
- ❌ 미디어/이미지 첨부 (텍스트만)
- ❌ 백엔드 서비스 레이어 직접 호출 (반드시 HTTP API 경유)
- ❌ 대화 메모리 (게시글+스레드 맥락만)
- ❌ 동적 스케줄 변경 (고정 cron)
