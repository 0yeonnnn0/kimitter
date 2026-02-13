# 2026-02-13: Bot System 구현 진행 상황

## 개요

Kimitter 가족 SNS에 3개의 자동 봇(주식/정치/뉴스)을 **완전히 별도의 외부 서비스**로 구축하는 작업. 총 12개 태스크를 4개 Wave로 나누어 병렬 실행 중.

- **플랜 파일**: `.sisyphus/plans/bot-system.md`
- **진행률**: Wave 1 완료 (3/3), Wave 2 진행 중 (2/4 완료)

---

## 커밋 이력

| 순서 | 커밋 해시 | 메시지 | Wave/Task |
|------|-----------|--------|-----------|
| 1 | `c15dc7f` | feat(backend): add BOT role to schema with login block and notification suppression | Wave 1 / Task 1 |
| 2 | `3cfd11e` | feat(bot): scaffold bot service with Kimitter API client | Wave 1 / Task 2 |
| 3 | `f5ed0b1` | feat(frontend): add BOT role type and badge component | Wave 1 / Task 3 |

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

## Wave 2 — 진행 중 🔄

### Task 4: OpenAI 서비스 + 프롬프트 템플릿 — 진행 중 ⏳

**목표:**
- `bot/src/services/openaiService.ts` — GPT-4o-mini 클라이언트
  - `generatePostContent(type, rawData)` → 게시글 콘텐츠 생성
  - `generateCommentReply(botType, postContent, thread, comment)` → 댓글 답변
- `bot/src/config/prompts.ts` — 한국어 프롬프트 템플릿 (주식/정치/뉴스 게시글 + 댓글 답변)

**상태:** 백그라운드 에이전트 실행 중 (`bg_d0c696cc`)

---

### Task 5: Naver News API 클라이언트 — 완료 ✅

**생성 파일:**
- `bot/src/services/naverNewsService.ts`
  - `searchNews(query, display)` — Naver News API 검색
  - `stripHtmlTags(text)` — HTML 태그 제거
  - `filterRecentNews(items, hoursAgo)` — 24시간 내 뉴스 필터링
  - `getPoliticalNews()` — 정치 뉴스 (최대 10건)
  - `getGeneralNews()` — 일반 뉴스 (정치/주식 키워드 제외, 최대 10건)
- `bot/src/services/naverNewsService.test.ts` — 16 테스트

**검증:**
- `npm test` — 27 passed (16 신규 + 11 기존)
- `npx tsc --noEmit` — 에러 없음

---

### Task 6: KIS 주식 API 클라이언트 — 완료 ✅

**생성 파일:**
- `bot/src/services/kisStockService.ts`
  - `KisStockService` 클래스
  - `authenticate()` — OAuth2 토큰 관리
  - `getStockPrice(ticker)` — 종목 현재가 조회 (tr_id: FHKST01010100)
  - `getTrendingStocks(count)` — 거래량 상위 종목 (tr_id: FHPST01710000)
  - 토큰 만료 시 자동 재인증
- `bot/src/services/kisStockService.test.ts` — 12 테스트

**검증:**
- `npm test` — all tests pass
- `npx tsc --noEmit` — 에러 없음

---

### Task 7: Backend 웹훅 발송 로직 — 진행 중 ⏳

**목표:**
- `backend/src/services/webhookService.ts` — 웹훅 디스패치 서비스
  - `sendBotWebhook(payload)` — 봇 서비스에 HTTP POST (fire-and-forget)
- `backend/src/services/commentService.ts` 수정
  - 봇 게시글에 댓글 시 웹훅 발송 (postAuthor.role === 'BOT' && commentAuthor.role !== 'BOT')
- `backend/src/config/environment.ts` — BOT_WEBHOOK_URL 추가

**상태:** 백그라운드 에이전트 실행 중 (`bg_46517193`)

---

## 남은 작업 (Wave 3-4)

### Wave 3 (Wave 2 완료 후)
| Task | 설명 | 예상 규모 |
|------|------|-----------|
| 8 | Bot Service — 3개 봇 구현 (stockBot/politicsBot/newsBot) | 대 |
| 9 | Bot Service — 웹훅 수신 서버 + 댓글 답변 로직 | 중 |
| 10 | Bot Service — 스케줄러 (node-cron) + 봇 계정 seed 스크립트 | 소 |

### Wave 4 (Wave 3 완료 후)
| Task | 설명 | 예상 규모 |
|------|------|-----------|
| 11 | Bot Service — Dockerfile + docker-compose | 소 |
| 12 | Integration test — 전체 플로우 검증 | 중 |

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
