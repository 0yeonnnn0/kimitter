# Kimitter Bot System — 외부 봇 서비스

## TL;DR

> **Quick Summary**: Kimitter 가족 SNS에 3개의 자동 봇(주식/정치/뉴스)을 **별도의 독립 서비스**로 구축한다. 봇 서비스는 Kimitter HTTP API를 통해 글을 게시하고 웹훅으로 댓글을 감지하여 AI(GPT-4o-mini)로 답변한다.
>
> **Deliverables**:
> - `bot/` — 독립 Node.js 봇 서비스 (스케줄러 + AI 콘텐츠 생성 + 웹훅 수신)
> - `backend/` — BOT role 추가, 웹훅 발송 로직, 봇 로그인 차단
> - `frontend/` — 봇 뱃지 + 프로필 이미지 UI
> - Docker — 봇 서비스 전용 Dockerfile + docker-compose
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 4 → Task 6 → Task 8 → Task 10 → Task 11

---

## Context

### Original Request
가족 SNS(Kimitter)에 구성원이 글을 많이 올리지 않아 심심하니까, 봇들이 자동으로 글을 올리도록 하고 싶다. 주식봇(주 1회), 정치봇(일 1회), 뉴스봇(일 1회)을 추가하고, 댓글을 통한 질의응답도 지원.

### Interview Summary
**Key Discussions**:
- 콘텐츠 생성: **하이브리드** — 기본 구조는 템플릿, 요약/설명은 GPT-4o-mini 생성
- 댓글 응답: **빠른 응답 (1~2분)** — 웹훅 기반으로 백엔드가 봇 서비스에 알림
- 봇 유저: **BOT role 추가** — Prisma schema에 BOT enum 추가
- 봇 UI: **프로필 이미지 + BOT 뱃지** 모두 표시
- 주식봇 기업: **AI 자동 선정** — 매주 트렌딩 기업을 AI가 선택
- 관리자 제어: **환경변수로만** ON/OFF
- 게시 시간: **아침 8시 KST** (정치 8:00, 뉴스 8:01, 주식 월 8:02)
- 댓글 맥락: **게시글 + 댓글 스레드** 전체를 AI에 전달
- 뉴스 카테고리: **전체 종합** + 출처 URL 포함
- **아키텍처: 완전히 별도의 외부 서비스** — bot/ 디렉토리, 별도 Docker, HTTP API 경유
- 댓글 감지: **웹훅** — 백엔드가 봇 게시글 댓글 시 봇 서비스에 HTTP 요청
- 배포: **별도 docker-compose**
- 테스트: **TDD** (Jest)

**Research Findings**:
- node-cron: 경량, Asia/Seoul timezone 지원, Express 통합 간편
- GPT-4o-mini: $0.15/$0.60 per 1M tokens, 월 ~$2
- 한국투자증권 Open API: 무료, KOSPI/KOSDAQ 공식
- Naver News API: 무료, 일 25,000건
- 기존 코드: Controller → Service → Prisma 패턴, setInterval만 사용 중

### Metis Review
**Identified Gaps** (addressed):
- `adminValidation.ts`에서 `Joi.string().valid('USER', 'ADMIN')` → 'BOT' 추가 필요
- 봇 계정 로그인 차단 필요 (role === 'BOT'이면 login 거부)
- 봇에게 알림 전송 억제 (wasted DB rows 방지)
- 동시 게시 시 API 부하 → 시간 1~2분 스태거링
- 중복 게시 방지 → 당일 이미 게시했는지 체크
- 봇 reply 무한 루프 방지 → 봇 댓글에는 봇이 응답 안 함
- 삭제된 댓글에 봇 응답 방지 → deletedAt 체크
- AI 프롬프트에 한국어 출력 명시 필요
- 봇 계정 비밀번호는 랜덤 64자 해시 (brute-force 방지)

---

## Work Objectives

### Core Objective
Kimitter에 3개의 자동 봇(주식/정치/뉴스)을 별도의 외부 서비스로 구축하여, 스케줄에 따라 자동으로 글을 게시하고 사용자 댓글에 AI로 답변하는 시스템을 완성한다.

### Concrete Deliverables
- `bot/` — 독립 Node.js/TypeScript 서비스 (Express + node-cron)
- `bot/src/bots/stockBot.ts` — 주식봇 (주 1회 게시, 댓글 Q&A)
- `bot/src/bots/politicsBot.ts` — 정치봇 (일 1회 게시, 댓글 Q&A)
- `bot/src/bots/newsBot.ts` — 뉴스봇 (일 1회 게시, 댓글 Q&A)
- `bot/src/services/` — OpenAI, Naver News, KIS Stock API 클라이언트
- `bot/src/api/kimitterClient.ts` — Kimitter API HTTP 클라이언트 (인증, 게시, 댓글)
- `bot/src/webhook/` — 웹훅 수신 Express 서버
- `bot/Dockerfile` + `bot/docker-compose.yml`
- `backend/` — BOT role migration, 웹훅 발송 로직, 봇 로그인 차단, 봇 알림 억제
- `frontend/` — BOT 뱃지 컴포넌트, User role 타입 업데이트

### Definition of Done
- [ ] `npm test` passes in bot/, backend/, frontend/
- [ ] `npx tsc --noEmit` passes in bot/, backend/, frontend/
- [ ] `npm run build` succeeds in bot/, backend/
- [ ] 봇 3개가 스케줄에 따라 자동 게시됨 (수동 트리거 테스트로 검증)
- [ ] 봇 게시글에 댓글 작성 시 봇이 AI 답변을 자동 생성
- [ ] 프론트에서 봇 계정에 BOT 뱃지 표시

### Must Have
- 3개 봇 (주식/정치/뉴스) 각각 스케줄 게시
- 웹훅 기반 댓글 응답 (1-2분 내)
- AI 콘텐츠 생성 (하이브리드: 템플릿 + GPT-4o-mini)
- BOT role + 프론트 뱃지
- 봇 계정 자동 생성 (seed script)
- 에러 핸들링 (외부 API 실패 시 graceful fallback)

### Must NOT Have (Guardrails)
- 관리자 봇 제어 UI/API (환경변수만)
- 봇 간 상호작용 (봇끼리 댓글 주고받기)
- 미디어/이미지 첨부 또는 생성 (텍스트만)
- 백엔드 서비스 레이어 직접 호출 (반드시 HTTP API 경유)
- 대화 메모리 (게시글+스레드 맥락만, 과거 대화 기억 X)
- 봇 게시글 수정/삭제 기능
- 분석/통계 대시보드
- 여러 뉴스 소스 (Naver API만)
- 스케줄 동적 변경 (고정 cron)
- 슬래시 커맨드 ("/stock AAPL" 등)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> **FORBIDDEN**: "사용자가 직접 테스트...", "사용자가 눈으로 확인..."
> **ALL verification is executed by the agent** using tools.

### Test Decision
- **Infrastructure exists**: YES (Jest in backend/ and frontend/)
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: Jest (backend, frontend), Jest (bot — new setup)

### TDD Workflow Per Task

Each TODO follows RED-GREEN-REFACTOR:
1. **RED**: Write failing test first → `npm test [file]` → FAIL
2. **GREEN**: Implement minimum code to pass → `npm test [file]` → PASS
3. **REFACTOR**: Clean up while keeping green → `npm test [file]` → PASS

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Backend API | Bash (curl) | Send requests, parse responses, assert fields |
| Bot Service | Bash (curl + node) | Trigger bot, verify post created via API |
| Frontend UI | Playwright | Navigate, assert DOM, screenshot |
| Docker | Bash (docker) | Build, run, health check |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Backend — BOT role migration + validation fixes
├── Task 2: Bot Service — project scaffold + Kimitter API client
└── Task 3: Frontend — BOT role type update + badge component

Wave 2 (After Wave 1):
├── Task 4: Bot Service — OpenAI service + prompt templates
├── Task 5: Bot Service — Naver News API client
├── Task 6: Bot Service — KIS Stock API client
└── Task 7: Backend — webhook dispatch on comment creation

Wave 3 (After Wave 2):
├── Task 8: Bot Service — 3 bot implementations (stock/politics/news)
├── Task 9: Bot Service — webhook receiver + comment reply logic
└── Task 10: Bot Service — scheduler (node-cron) + bot user seed

Wave 4 (After Wave 3):
├── Task 11: Bot Service — Docker + docker-compose
└── Task 12: Integration test — full flow verification
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 7, 10 | 2, 3 |
| 2 | None | 4, 5, 6, 8, 9, 10 | 1, 3 |
| 3 | None | 12 | 1, 2 |
| 4 | 2 | 8 | 5, 6, 7 |
| 5 | 2 | 8 | 4, 6, 7 |
| 6 | 2 | 8 | 4, 5, 7 |
| 7 | 1 | 9 | 4, 5, 6 |
| 8 | 4, 5, 6 | 10, 12 | 9 |
| 9 | 7, 2 | 12 | 8 |
| 10 | 1, 2, 8 | 11, 12 | 9 |
| 11 | 10 | 12 | None |
| 12 | All | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | 3 parallel agents |
| 2 | 4, 5, 6, 7 | 4 parallel agents |
| 3 | 8, 9, 10 | 3 parallel agents (8 is larger) |
| 4 | 11, 12 | Sequential |

---

## TODOs

---

- [ ] 1. Backend — BOT role 추가 + validation 수정 + 봇 로그인 차단

  **What to do**:
  - Prisma schema `enum Role`에 `BOT` 추가 (`prisma/schema.prisma`)
  - `npx prisma migrate dev --name add-bot-role` 실행
  - `adminValidation.ts`의 `updateRoleSchema`에 `'BOT'` 추가
  - `authService.ts`의 `login` 함수에서 `role === 'BOT'`이면 로그인 거부 (ForbiddenError)
  - 봇 사용자에게 알림 전송 억제: `notificationService.ts`에서 `recipient.role === 'BOT'`이면 notification 생성 스킵
  - TDD: 각 변경에 대한 테스트 먼저 작성

  **Must NOT do**:
  - 기존 서비스 함수 시그니처 변경 금지
  - 새로운 API 엔드포인트 추가 금지 (이 태스크에서는)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 스키마 변경 + 몇 줄 수정으로 범위가 작음
  - **Skills**: []
    - DB migration과 validation 수정은 기본 코딩으로 충분

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 7, 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `backend/prisma/schema.prisma:11-14` — 현재 Role enum 정의 (USER, ADMIN)
  - `backend/src/services/authService.ts:86-110` — login 함수, 여기에 BOT 로그인 차단 추가
  - `backend/src/services/notificationService.ts:40-80` — createNotification 함수, recipient role 체크 추가 위치

  **API/Type References**:
  - `backend/src/types/api.ts` — API response 타입 (Role 관련 타입 확인)

  **Validation References**:
  - `backend/src/middleware/` — adminValidation.ts 내 updateRoleSchema에서 `Joi.string().valid('USER', 'ADMIN')` → `'BOT'` 추가

  **Test References**:
  - `backend/src/services/` — 기존 authService 테스트 패턴 참고

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `role === 'BOT'` 사용자 로그인 시 ForbiddenError 발생
  - [ ] Test: BOT role 사용자에게 notification 생성되지 않음
  - [ ] `npx prisma migrate dev --name add-bot-role` → 성공
  - [ ] `npx tsc --noEmit` → 에러 없음 (backend/)
  - [ ] `npm test` → 기존 테스트 + 새 테스트 모두 PASS (backend/)

  Agent-Executed QA:
  ```
  Scenario: BOT role migration 성공 확인
    Tool: Bash
    Steps:
      1. npx prisma migrate dev --name add-bot-role
      2. Assert: migration 성공 메시지 출력
      3. npx prisma db execute --stdin <<< "SELECT unnest(enum_range(NULL::\"Role\"));"
      4. Assert: 출력에 'BOT' 포함

  Scenario: BOT 사용자 로그인 거부
    Tool: Bash (curl)
    Preconditions: dev server 실행 중, BOT role 사용자 존재
    Steps:
      1. 테스트용 BOT 사용자 DB에 직접 생성 (prisma seed 또는 SQL)
      2. curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"test-bot","password":"test123"}'
      3. Assert: HTTP 403
      4. Assert: response.error에 "Bot accounts cannot login" 포함
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(backend): add BOT role to schema with login block and notification suppression`
  - Files: `prisma/schema.prisma`, `src/services/authService.ts`, `src/services/notificationService.ts`, `src/middleware/adminValidation.ts`, 관련 test 파일
  - Pre-commit: `npm test && npx tsc --noEmit`

---

- [ ] 2. Bot Service — 프로젝트 스캐폴드 + Kimitter API 클라이언트

  **What to do**:
  - `bot/` 디렉토리에 Node.js/TypeScript 프로젝트 생성
    - `package.json` (dependencies: express, axios, node-cron, openai, typescript, jest, ts-jest, ts-node, dotenv)
    - `tsconfig.json` (strict mode, ES2020 target)
    - `jest.config.ts`
    - `.env.example`
    - `src/` 디렉토리 구조:
      ```
      bot/src/
      ├── config/        # environment.ts, constants.ts
      ├── api/           # kimitterClient.ts
      ├── services/      # openai, naver, kis
      ├── bots/          # stockBot, politicsBot, newsBot
      ├── webhook/       # webhookServer.ts
      ├── utils/         # logger.ts, retry.ts
      ├── types/         # bot.ts, api.ts
      └── index.ts       # entry point
      ```
  - `bot/src/config/environment.ts` — 환경변수 관리 (Kimitter API URL, JWT credentials, OpenAI key, Naver/KIS keys, webhook port, bot 설정)
  - `bot/src/api/kimitterClient.ts` — Kimitter API HTTP 클라이언트:
    - `login(username, password)` → JWT 토큰 획득
    - `refreshToken()` → 토큰 자동 갱신
    - `createPost(content, tags)` → POST /api/posts
    - `createComment(postId, content)` → POST /api/comments/post/:postId
    - `createReply(commentId, content)` → POST /api/comments/:commentId/replies
    - `getComments(postId)` → GET /api/comments/post/:postId
    - `getMyPosts()` → GET /api/posts (본인 게시글 조회)
    - 자동 토큰 갱신: 401 응답 시 refresh token으로 재인증
  - `bot/src/utils/logger.ts` — Winston 로거 (backend 패턴 참고)
  - `bot/src/utils/retry.ts` — exponential backoff retry 유틸리티
  - TDD: kimitterClient의 각 메서드에 대한 테스트 먼저 작성 (axios mock)

  **Must NOT do**:
  - 실제 봇 로직 구현 (이 태스크는 인프라만)
  - 백엔드 코드 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 새 프로젝트 스캐폴딩 + API 클라이언트 구현. 파일 수 많고 설정 복잡
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5, 6, 8, 9, 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `backend/src/config/environment.ts` — 환경변수 관리 패턴 (동일 패턴으로 구현)
  - `backend/src/utils/logger.ts` — Winston 로거 설정 패턴
  - `backend/src/services/emailService.ts` — 외부 서비스 클라이언트 패턴 (lazy init, error handling)
  - `backend/package.json` — 의존성 참고, tsconfig 패턴 참고

  **API References** (봇이 호출할 Kimitter 엔드포인트):
  - `backend/src/routes/posts.ts:13` — `POST /api/posts` (content, tags)
  - `backend/src/routes/comments.ts` — `POST /api/comments/post/:postId`, `POST /api/comments/:commentId/replies`
  - `backend/src/routes/auth.ts` — `POST /api/auth/login`, `POST /api/auth/refresh`
  - `backend/src/controllers/postController.ts:4-17` — createPost 요청 형식
  - `backend/src/controllers/commentController.ts:4-16` — createComment 요청 형식

  **Type References**:
  - `backend/src/types/api.ts` — API 응답 형식 참고 (`{ success: boolean, data: T }`)

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `kimitterClient.login()` — 성공 시 토큰 저장, 실패 시 에러 throw
  - [ ] Test: `kimitterClient.createPost()` — 올바른 형식으로 POST 요청
  - [ ] Test: `kimitterClient.createComment()` — 올바른 형식으로 POST 요청
  - [ ] Test: `kimitterClient.createReply()` — 올바른 형식으로 POST 요청
  - [ ] Test: 자동 토큰 갱신 — 401 응답 시 refreshToken 호출 후 재시도
  - [ ] Test: retry 유틸 — exponential backoff 동작 확인
  - [ ] `npx tsc --noEmit` → 에러 없음 (bot/)
  - [ ] `npm test` → 모든 테스트 PASS (bot/)

  Agent-Executed QA:
  ```
  Scenario: bot/ 프로젝트 빌드 성공
    Tool: Bash
    Steps:
      1. cd bot/ && npm install
      2. npx tsc --noEmit
      3. Assert: exit code 0, no errors
    Evidence: Terminal output captured

  Scenario: Kimitter API 클라이언트 테스트 통과
    Tool: Bash
    Steps:
      1. cd bot/ && npm test -- src/api/kimitterClient.test.ts
      2. Assert: All tests pass
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(bot): scaffold bot service with Kimitter API client`
  - Files: `bot/` 전체
  - Pre-commit: `cd bot && npm test && npx tsc --noEmit`

---

- [ ] 3. Frontend — BOT role 타입 업데이트 + 봇 뱃지 컴포넌트

  **What to do**:
  - `frontend/src/types/models.ts`에서 User.role 타입에 `'BOT'` 추가
  - 봇 뱃지 컴포넌트 생성: `frontend/src/components/BotBadge.tsx`
    - 닉네임 옆에 작은 'BOT' 텍스트 뱃지 표시
    - 봇 전용 프로필 이미지 테두리 또는 스타일링
  - `PostCard` 컴포넌트에 봇 뱃지 조건부 렌더링 추가 (user.role === 'BOT')
  - 댓글 영역에도 동일한 봇 뱃지 적용
  - TDD: BotBadge 컴포넌트 + PostCard 봇 표시 테스트

  **Must NOT do**:
  - 별도의 봇 전용 PostCard 컴포넌트 생성 (기존 PostCard 재사용)
  - 봇 관리 UI 화면 생성
  - 봇 전용 스타일링 외 PostCard 구조 변경

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 컴포넌트 생성 + 스타일링 작업
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 봇 뱃지 디자인, PostCard 통합

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 12
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/PostCard.tsx` — 기존 PostCard 컴포넌트, 여기에 봇 뱃지 조건부 추가
  - `frontend/src/components/` — 기존 컴포넌트 스타일링 패턴 참고

  **Type References**:
  - `frontend/src/types/models.ts` — User 인터페이스, role 필드 타입 업데이트 위치

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: BotBadge 컴포넌트 — role='BOT'일 때 뱃지 렌더링
  - [ ] Test: BotBadge 컴포넌트 — role='USER'일 때 뱃지 미렌더링
  - [ ] Test: PostCard — 봇 게시글에 뱃지 표시 확인
  - [ ] `npx tsc --noEmit` → 에러 없음 (frontend/)
  - [ ] `npm test` → 모든 테스트 PASS (frontend/)

  Agent-Executed QA:
  ```
  Scenario: 봇 뱃지가 봇 게시글에만 표시됨
    Tool: Playwright (playwright skill)
    Preconditions: Expo dev server 실행, 봇 계정 게시글 + 일반 사용자 게시글 존재
    Steps:
      1. Navigate to feed screen
      2. Assert: 봇 게시글의 닉네임 옆에 'BOT' 텍스트 또는 뱃지 요소 존재
      3. Assert: 일반 사용자 게시글에는 뱃지 없음
      4. Screenshot: .sisyphus/evidence/task-3-bot-badge.png
    Evidence: .sisyphus/evidence/task-3-bot-badge.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add BOT role type and badge component`
  - Files: `frontend/src/types/models.ts`, `frontend/src/components/BotBadge.tsx`, `frontend/src/components/PostCard.tsx`
  - Pre-commit: `cd frontend && npm test && npx tsc --noEmit`

---

- [ ] 4. Bot Service — OpenAI 서비스 + 프롬프트 템플릿

  **What to do**:
  - `bot/src/services/openaiService.ts`:
    - OpenAI 클라이언트 초기화 (GPT-4o-mini)
    - `generatePostContent(type: BotType, rawData: string)` → 게시글 생성
    - `generateCommentReply(postContent: string, commentThread: Comment[], userComment: string)` → 댓글 답변 생성
    - 에러 핸들링: API 실패 시 graceful fallback (로그만 남기고 skip)
    - 토큰 사용량 로깅
  - `bot/src/config/prompts.ts` — AI 프롬프트 상수:
    - **주식봇 게시글 프롬프트**: 한국어, 📊 이모지, 기업 소개 + 뉴스 + 주가 정리, 가족 SNS 톤
    - **정치봇 게시글 프롬프트**: 한국어, 🏛️ 이모지, 전날 정치 뉴스 요약, 중립적/사실적
    - **뉴스봇 게시글 프롬프트**: 한국어, 📰 이모지, 카테고리별 뉴스 + 출처 URL 포함, 다양한 주제
    - **댓글 답변 프롬프트**: 한국어, 대화형, 원 게시글 맥락 참조, 봇 성격에 맞는 톤
    - 모든 프롬프트에 `반드시 한국어로 답변하세요` 명시
  - TDD: OpenAI 서비스 각 메서드 테스트 (openai mock)

  **Must NOT do**:
  - 프롬프트를 코드 내 인라인 문자열로 작성 (반드시 prompts.ts에 분리)
  - AI 응답 내용 검열/필터링 로직

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: OpenAI API 통합 + 프롬프트 엔지니어링. 세심한 프롬프트 설계 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `bot/src/config/environment.ts` — 환경변수에서 OPENAI_API_KEY, OPENAI_MODEL 로드
  - `bot/src/utils/retry.ts` — API 호출 실패 시 retry 패턴

  **External References**:
  - OpenAI Node.js SDK: `https://github.com/openai/openai-node` — chat.completions.create 사용법
  - GPT-4o-mini: temperature 0.7, max_tokens 500 (게시글), 300 (댓글)

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `generatePostContent('stock', rawData)` — 올바른 모델과 프롬프트로 OpenAI 호출
  - [ ] Test: `generatePostContent('politics', rawData)` — 정치 프롬프트 사용 확인
  - [ ] Test: `generatePostContent('news', rawData)` — 뉴스 프롬프트 사용 확인
  - [ ] Test: `generateCommentReply()` — 게시글 맥락 + 댓글 스레드 전체를 프롬프트에 포함
  - [ ] Test: OpenAI API 실패 시 에러 로그 남기고 null 반환 (throw 안 함)
  - [ ] `npm test` → 모든 테스트 PASS (bot/)

  Agent-Executed QA:
  ```
  Scenario: OpenAI 서비스 테스트 통과
    Tool: Bash
    Steps:
      1. cd bot/ && npm test -- src/services/openaiService.test.ts
      2. Assert: All tests pass
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(bot): add OpenAI service with Korean prompt templates`
  - Files: `bot/src/services/openaiService.ts`, `bot/src/config/prompts.ts`, 관련 test
  - Pre-commit: `cd bot && npm test`

---

- [ ] 5. Bot Service — Naver News API 클라이언트

  **What to do**:
  - `bot/src/services/naverNewsService.ts`:
    - `searchNews(query: string, display?: number)` → Naver 뉴스 검색
    - `getPoliticalNews()` → 전날 정치 뉴스 (query: "한국 정치")
    - `getGeneralNews()` → 전날 일반 뉴스 (정치/주식 키워드 제외)
    - HTML 태그 제거 유틸
    - 응답에서 title, description, link, pubDate 추출
    - 24시간 내 뉴스만 필터링
    - 결과에 출처 URL 반드시 포함
  - TDD: 각 메서드 테스트 (axios mock으로 Naver API 응답 시뮬레이션)

  **Must NOT do**:
  - 다른 뉴스 소스 추가 (Naver만)
  - 뉴스 내용 전체 크롤링 (API 응답의 title/description만 사용)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 외부 API 클라이언트 구현, 범위 작음
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:

  **External References**:
  - Naver News API: `https://developers.naver.com/docs/serviceapi/search/news/news.md` — 검색 API 스펙
  - Headers: `X-Naver-Client-Id`, `X-Naver-Client-Secret`
  - Endpoint: `https://openapi.naver.com/v1/search/news.json`
  - Params: `query`, `display` (max 100), `sort` (date/sim)

  **Pattern References**:
  - `bot/src/api/kimitterClient.ts` — axios 사용 패턴 참고
  - `bot/src/utils/retry.ts` — retry 패턴

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `searchNews("정치")` — Naver API에 올바른 헤더/파라미터로 요청
  - [ ] Test: HTML 태그 제거 — `<b>태그</b>` → `태그`
  - [ ] Test: 24시간 필터링 — 오래된 뉴스 제외
  - [ ] Test: 출처 URL 포함 확인
  - [ ] Test: API 실패 시 빈 배열 반환
  - [ ] `npm test` → 모든 테스트 PASS (bot/)

  **Commit**: YES
  - Message: `feat(bot): add Naver News API client`
  - Files: `bot/src/services/naverNewsService.ts`, 관련 test
  - Pre-commit: `cd bot && npm test`

---

- [ ] 6. Bot Service — KIS 주식 API 클라이언트

  **What to do**:
  - `bot/src/services/kisStockService.ts`:
    - OAuth 인증: `authenticate()` → access token 획득
    - `getStockPrice(ticker: string)` → 종목 현재가 조회
    - `getCompanyInfo(ticker: string)` → 기업 기본 정보
    - `getTrendingStocks()` → 거래량 상위 종목 (AI가 선정할 데이터 제공)
    - 응답 파싱: 한글 종목명, 현재가(₩), 전일대비 변동률(%) 등
    - 토큰 만료 시 자동 재인증
  - TDD: 각 메서드 테스트 (axios mock)

  **Must NOT do**:
  - 실시간 시세 스트리밍
  - 해외 주식 데이터 (한국 시장만)
  - 주식 매매/주문 기능

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 외부 API 클라이언트, 범위 작음
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:

  **External References**:
  - KIS Open API: `https://apiportal.koreainvestment.com` — 한국투자증권 오픈 API 포털
  - GitHub: `https://github.com/koreainvestment/open-trading-api` — 공식 예제
  - Auth: OAuth2 Client Credentials → access token
  - 현재가 조회: `GET /uapi/domestic-stock/v1/quotations/inquire-price` (tr_id: FHKST01010100)
  - 거래량 상위: `GET /uapi/domestic-stock/v1/quotations/volume-rank` (tr_id: FHPST01710000)

  **Pattern References**:
  - `bot/src/api/kimitterClient.ts` — axios + 토큰 관리 패턴 참고

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `authenticate()` — OAuth2 토큰 요청 + 저장
  - [ ] Test: `getStockPrice("005930")` — 삼성전자 현재가 조회 (mock)
  - [ ] Test: `getTrendingStocks()` — 거래량 상위 종목 리스트 반환
  - [ ] Test: 토큰 만료 시 자동 재인증
  - [ ] Test: API 실패 시 graceful 에러 처리
  - [ ] `npm test` → 모든 테스트 PASS (bot/)

  **Commit**: YES
  - Message: `feat(bot): add KIS stock API client`
  - Files: `bot/src/services/kisStockService.ts`, 관련 test
  - Pre-commit: `cd bot && npm test`

---

- [ ] 7. Backend — 웹훅 발송 로직 (댓글 생성 시 봇 서비스에 알림)

  **What to do**:
  - `backend/src/services/webhookService.ts` 생성:
    - `sendBotWebhook(payload: WebhookPayload)` — 봇 서비스에 HTTP POST 요청
    - payload: `{ postId, commentId, commentContent, commentAuthor, parentCommentId? }`
    - BOT_WEBHOOK_URL 환경변수에서 봇 서비스 URL 로드
    - 실패 시 로그만 남김 (fire-and-forget, 댓글 생성 블로킹 금지)
    - BOT_WEBHOOK_URL이 비어있으면 웹훅 스킵 (안전 장치)
  - `commentService.ts`의 `createComment`와 `createReply` 함수 끝에 웹훅 호출 추가:
    - 조건: 게시글 작성자의 role === 'BOT' AND 댓글 작성자의 role !== 'BOT'
    - 비동기 fire-and-forget: `sendBotWebhook(payload).catch(err => logger.error(...))`
    - 댓글 생성 응답에 영향 없음 (웹훅 실패해도 댓글은 정상 생성)
  - `backend/src/config/environment.ts`에 `BOT_WEBHOOK_URL` 추가
  - `.env.example`에 `BOT_WEBHOOK_URL` 추가
  - TDD: webhookService 테스트 + commentService에 웹훅 트리거 테스트

  **Must NOT do**:
  - 웹훅 재시도 로직 (fire-and-forget만)
  - 웹훅 큐/버퍼링
  - commentService의 기존 반환값/시그니처 변경
  - 댓글 생성 API 응답 지연 (웹훅은 비동기)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 새 서비스 1개 + 기존 서비스에 hook 추가. 중간 복잡도
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1 (BOT role 필요)

  **References**:

  **Pattern References**:
  - `backend/src/services/notificationService.ts` — fire-and-forget 비동기 패턴 (push notification 발송)
  - `backend/src/services/commentService.ts:9-81` — createComment 함수 끝에 웹훅 호출 추가 위치
  - `backend/src/services/commentService.ts:134-172` — createReply 함수 끝에 웹훅 호출 추가 위치
  - `backend/src/config/environment.ts` — 환경변수 추가 패턴

  **API/Type References**:
  - `backend/prisma/schema.prisma:37-60` — User 모델, role 필드로 BOT 여부 확인

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `sendBotWebhook()` — 올바른 payload로 HTTP POST 요청
  - [ ] Test: `sendBotWebhook()` — BOT_WEBHOOK_URL 미설정 시 스킵
  - [ ] Test: `sendBotWebhook()` — HTTP 요청 실패 시 에러 로그만 남기고 throw 안 함
  - [ ] Test: `createComment` — 봇 게시글에 댓글 시 웹훅 발송됨
  - [ ] Test: `createComment` — 일반 유저 게시글에 댓글 시 웹훅 미발송
  - [ ] Test: `createComment` — 봇이 자기 게시글에 댓글 시 웹훅 미발송 (BOT→BOT 방지)
  - [ ] `npx tsc --noEmit` → 에러 없음 (backend/)
  - [ ] `npm test` → 기존 + 새 테스트 모두 PASS (backend/)

  Agent-Executed QA:
  ```
  Scenario: 봇 게시글에 댓글 시 웹훅 발송 확인
    Tool: Bash (curl)
    Preconditions: backend dev server 실행, BOT 유저의 게시글 존재, BOT_WEBHOOK_URL=http://localhost:4000/webhook
    Steps:
      1. 봇 서비스 웹훅 엔드포인트 mock 실행 (nc -l 4000 또는 간단한 express)
      2. curl -X POST http://localhost:3000/api/comments/post/{botPostId} -H "Authorization: Bearer {userToken}" -H "Content-Type: application/json" -d '{"content":"질문입니다"}'
      3. Assert: HTTP 201 (댓글 생성 성공)
      4. Assert: mock 서버에 웹훅 요청 수신 확인
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(backend): add webhook dispatch for bot post comments`
  - Files: `backend/src/services/webhookService.ts`, `backend/src/services/commentService.ts`, `backend/src/config/environment.ts`, `.env.example`, 관련 test
  - Pre-commit: `npm test && npx tsc --noEmit`

---

- [ ] 8. Bot Service — 3개 봇 구현 (주식/정치/뉴스)

  **What to do**:
  - `bot/src/bots/baseBbot.ts` — 공통 봇 베이스 클래스/인터페이스:
    - `generatePost()` → 게시글 콘텐츠 생성
    - `getPostTags()` → 태그 반환
    - `getBotType()` → 봇 타입 식별
  - `bot/src/bots/stockBot.ts`:
    - KIS API로 거래량 상위 종목 조회
    - AI가 그 중 하나를 선정하여 기업 소개 + 뉴스 + 주가 정리
    - 태그: `['주식', '경제', 기업명]`
    - 하이브리드: 주가 데이터는 정확한 숫자, 설명은 AI 생성
  - `bot/src/bots/politicsBot.ts`:
    - Naver News API로 전날 정치 뉴스 검색
    - AI로 주요 이슈 3-5개 요약
    - 태그: `['정치', '뉴스']`
    - 출처 URL 포함
  - `bot/src/bots/newsBot.ts`:
    - Naver News API로 전날 일반 뉴스 검색 (정치/주식 키워드 제외)
    - AI로 카테고리별 주요 뉴스 요약
    - 태그: `['뉴스', 카테고리명]`
    - 출처 URL 반드시 포함
  - 모든 봇 공통:
    - 중복 게시 방지: 게시 전 오늘 이미 게시했는지 확인 (getMyPosts 호출)
    - 에러 핸들링: 외부 API 실패 시 로그 남기고 스킵 (서버 크래시 방지)
  - TDD: 각 봇의 generatePost 테스트 (외부 서비스 mock)

  **Must NOT do**:
  - 봇 간 상호작용
  - 미디어/이미지 첨부
  - 게시글 수정/삭제
  - 슬래시 커맨드 파싱

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 3개 봇 로직 구현 + 외부 API 연동. 가장 큰 태스크
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: Tasks 10, 12
  - **Blocked By**: Tasks 4, 5, 6

  **References**:

  **Pattern References**:
  - `bot/src/services/openaiService.ts` — AI 콘텐츠 생성 호출
  - `bot/src/services/naverNewsService.ts` — 뉴스 데이터 조회
  - `bot/src/services/kisStockService.ts` — 주식 데이터 조회
  - `bot/src/api/kimitterClient.ts` — Kimitter API 호출 (createPost, getMyPosts)
  - `bot/src/config/prompts.ts` — AI 프롬프트 상수

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `stockBot.generatePost()` — KIS 데이터 조회 + AI 요약 생성 + createPost 호출
  - [ ] Test: `politicsBot.generatePost()` — Naver 정치 뉴스 조회 + AI 요약 + 출처 URL 포함
  - [ ] Test: `newsBot.generatePost()` — Naver 일반 뉴스 조회 + 정치/주식 제외 + 출처 URL 포함
  - [ ] Test: 중복 게시 방지 — 오늘 이미 게시한 경우 스킵
  - [ ] Test: 외부 API 실패 시 graceful 스킵 (에러 로그만)
  - [ ] `npm test` → 모든 테스트 PASS (bot/)

  Agent-Executed QA:
  ```
  Scenario: 주식봇 게시글 생성 (수동 트리거)
    Tool: Bash
    Steps:
      1. BOT_ENABLED=true 환경변수 설정
      2. node -e "require('./dist/bots/stockBot').generatePost()" (또는 테스트 스크립트)
      3. curl http://localhost:3000/api/posts (봇 게시글 조회)
      4. Assert: 주식 관련 게시글 생성됨
      5. Assert: 태그에 '주식' 포함
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(bot): implement stock, politics, and news bots`
  - Files: `bot/src/bots/` 전체
  - Pre-commit: `cd bot && npm test`

---

- [ ] 9. Bot Service — 웹훅 수신 서버 + 댓글 답변 로직

  **What to do**:
  - `bot/src/webhook/webhookServer.ts`:
    - Express 서버 (포트: BOT_WEBHOOK_PORT, 기본 4000)
    - `POST /webhook` — 백엔드로부터 댓글 알림 수신
    - Payload 검증: postId, commentId, commentContent, commentAuthor 필수
    - 선택적 시크릿 토큰 검증 (BOT_WEBHOOK_SECRET)
  - `bot/src/webhook/commentReplyHandler.ts`:
    - 웹훅 수신 시 처리 로직:
      1. commentAuthor가 봇이면 무시 (BOT→BOT 방지)
      2. deletedAt 체크 (Kimitter API로 댓글 존재 확인)
      3. 원 게시글 내용 조회 (Kimitter API)
      4. 댓글 스레드 조회 (Kimitter API)
      5. 봇 타입 판별 (postId로 어떤 봇의 게시글인지 확인)
      6. AI로 답변 생성 (openaiService.generateCommentReply)
      7. Kimitter API로 답변 댓글 작성 (createReply)
    - 대화 깊이 제한: 봇은 하나의 사용자 댓글에 최대 1회 답변
    - 에러 핸들링: AI 실패 시 로그만 남김
  - TDD: 웹훅 수신 + 댓글 답변 로직 테스트

  **Must NOT do**:
  - 봇끼리 대화 (BOT→BOT 응답 금지)
  - 무한 reply 루프 (깊이 제한)
  - 웹훅 실패 시 재시도 큐
  - 댓글 생성 응답 대기 (fire-and-forget)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 웹훅 서버 + 복잡한 비즈니스 로직 (맥락 수집, AI 호출, 방어 로직)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 7, 2

  **References**:

  **Pattern References**:
  - `bot/src/api/kimitterClient.ts` — Kimitter API 호출 (getComments, createReply)
  - `bot/src/services/openaiService.ts` — AI 댓글 답변 생성
  - `bot/src/config/prompts.ts` — 댓글 답변 프롬프트

  **API References** (봇이 호출할 엔드포인트):
  - `GET /api/comments/post/:postId` — 게시글 댓글 목록 조회
  - `POST /api/comments/:commentId/replies` — 댓글에 답변 작성
  - `GET /api/posts/:postId` — 게시글 상세 조회

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: `POST /webhook` — 올바른 payload 수신 시 200 응답
  - [ ] Test: `POST /webhook` — 필수 필드 누락 시 400 응답
  - [ ] Test: commentReplyHandler — 봇 타입 판별 + AI 답변 생성 + reply 작성
  - [ ] Test: commentReplyHandler — BOT 작성자 댓글 무시
  - [ ] Test: commentReplyHandler — 삭제된 댓글 무시
  - [ ] Test: commentReplyHandler — AI 실패 시 graceful 스킵
  - [ ] `npm test` → 모든 테스트 PASS (bot/)

  Agent-Executed QA:
  ```
  Scenario: 웹훅 수신 후 봇 댓글 답변 생성
    Tool: Bash (curl)
    Preconditions: bot 서비스 실행 (webhook port 4000), Kimitter backend 실행
    Steps:
      1. curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"postId":1,"commentId":10,"commentContent":"삼성전자 전망이 어때?","commentAuthor":{"id":2,"role":"USER"}}'
      2. Assert: HTTP 200
      3. 잠시 대기 (AI 처리 시간)
      4. curl http://localhost:3000/api/comments/post/1 (댓글 목록 조회)
      5. Assert: 봇 답변 댓글이 생성되어 있음
    Evidence: Response bodies captured
  ```

  **Commit**: YES
  - Message: `feat(bot): add webhook receiver and comment reply handler`
  - Files: `bot/src/webhook/`, 관련 test
  - Pre-commit: `cd bot && npm test`

---

- [ ] 10. Bot Service — 스케줄러 (node-cron) + 봇 계정 seed 스크립트

  **What to do**:
  - `bot/src/scheduler.ts`:
    - node-cron으로 3개 봇 스케줄 등록
    - 정치봇: `'0 8 * * *'` (매일 8:00 KST)
    - 뉴스봇: `'1 8 * * *'` (매일 8:01 KST)
    - 주식봇: `'2 8 * * 1'` (매월요일 8:02 KST)
    - timezone: `'Asia/Seoul'`
    - noOverlap: true
    - BOT_ENABLED 환경변수 체크 (false면 스케줄 등록 안 함)
    - Graceful shutdown: SIGTERM 시 모든 스케줄 정지
  - `bot/src/index.ts` — 앱 진입점:
    - 환경변수 로드
    - Kimitter API 클라이언트 초기화 (로그인)
    - 웹훅 서버 시작
    - 스케줄러 시작
    - 헬스체크 엔드포인트: `GET /health`
  - `bot/scripts/seedBotUsers.ts` — 봇 계정 생성 스크립트:
    - Kimitter API의 admin 엔드포인트 또는 직접 DB에 봇 유저 3개 생성
    - username: `stock-bot`, `politics-bot`, `news-bot`
    - nickname: `📊 주식봇`, `🏛️ 정치봇`, `📰 뉴스봇`
    - role: BOT
    - passwordHash: 랜덤 64자 (실제로는 로그인 불가능하지만 API 인증용 비밀번호 별도 설정)
    - profileImageUrl: 봇별 프로필 이미지 경로 설정
    - 이미 존재하면 스킵 (upsert)
  - `bot/assets/` — 봇 프로필 이미지 3개 (심플한 아이콘)
  - TDD: 스케줄러 등록/해제 테스트, seed 스크립트 테스트

  **Must NOT do**:
  - 동적 스케줄 변경 (고정 cron만)
  - 봇 유저 삭제/수정 기능
  - 관리자 API

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: node-cron 설정 + seed 스크립트. 패턴이 명확
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 1, 2, 8

  **References**:

  **Pattern References**:
  - `backend/src/server.ts:8` — `startCleanupSchedule()` 호출 패턴 (동일하게 스케줄러 시작)
  - `backend/src/services/notificationService.ts:191-194` — 기존 스케줄링 패턴 (setInterval → node-cron으로 업그레이드)
  - `bot/src/bots/` — 각 봇의 generatePost() 호출

  **External References**:
  - node-cron: `https://nodecron.com/` — cron 표현식, timezone 설정, noOverlap

  **Acceptance Criteria**:

  TDD:
  - [ ] Test: scheduler가 3개 cron job 등록
  - [ ] Test: BOT_ENABLED=false면 스케줄 미등록
  - [ ] Test: graceful shutdown 시 모든 job 정지
  - [ ] Test: seed 스크립트 — 봇 유저 3개 생성 (upsert)
  - [ ] `npm test` → 모든 테스트 PASS (bot/)

  Agent-Executed QA:
  ```
  Scenario: 봇 서비스 기동 + 헬스체크
    Tool: Bash
    Preconditions: backend 실행 중, .env 설정 완료
    Steps:
      1. cd bot/ && npm run dev &
      2. sleep 5
      3. curl http://localhost:4000/health
      4. Assert: HTTP 200, {"status":"ok"}
      5. 로그에 "Scheduler started" 메시지 확인
    Evidence: Terminal output captured

  Scenario: seed 스크립트로 봇 유저 생성
    Tool: Bash
    Preconditions: backend + DB 실행 중
    Steps:
      1. cd bot/ && npx ts-node scripts/seedBotUsers.ts
      2. curl http://localhost:3000/api/admin/users -H "Authorization: Bearer {adminToken}"
      3. Assert: 응답에 stock-bot, politics-bot, news-bot 유저 존재
      4. Assert: 모든 봇 유저의 role이 'BOT'
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(bot): add node-cron scheduler and bot user seed script`
  - Files: `bot/src/scheduler.ts`, `bot/src/index.ts`, `bot/scripts/seedBotUsers.ts`, `bot/assets/`
  - Pre-commit: `cd bot && npm test`

---

- [ ] 11. Bot Service — Dockerfile + docker-compose

  **What to do**:
  - `bot/Dockerfile`:
    - Multi-stage build (node:20-slim 기반)
    - Build stage: TypeScript 컴파일
    - Production stage: dist/ + node_modules만 포함
    - `CMD ["node", "dist/index.js"]`
    - EXPOSE 4000
  - `bot/docker-compose.yml`:
    - bot 서비스: Dockerfile 빌드 또는 이미지
    - 환경변수: .env 파일 참조
    - 네트워크: 백엔드와 같은 Docker 네트워크 연결 (kimitter-net)
    - 볼륨: bot assets (프로필 이미지)
    - restart: unless-stopped
  - `bot/.dockerignore` — node_modules, .env, dist 제외
  - `bot/.env.example` — 전체 환경변수 템플릿:
    ```
    # Kimitter API
    KIMITTER_API_URL=http://kimitter-backend:3000/api
    BOT_STOCK_USERNAME=stock-bot
    BOT_STOCK_PASSWORD=...
    BOT_POLITICS_USERNAME=politics-bot
    BOT_POLITICS_PASSWORD=...
    BOT_NEWS_USERNAME=news-bot
    BOT_NEWS_PASSWORD=...

    # Bot Control
    BOT_ENABLED=true
    BOT_WEBHOOK_PORT=4000
    BOT_WEBHOOK_SECRET=...

    # OpenAI
    OPENAI_API_KEY=sk-...
    OPENAI_MODEL=gpt-4o-mini

    # Naver News API
    NAVER_CLIENT_ID=...
    NAVER_CLIENT_SECRET=...

    # KIS Stock API
    KIS_APP_KEY=...
    KIS_APP_SECRET=...
    ```
  - `backend/.env.example`에 `BOT_WEBHOOK_URL` 추가

  **Must NOT do**:
  - 기존 backend docker-compose 수정
  - bot과 backend를 같은 docker-compose에 합치기

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Dockerfile + docker-compose 작성, 패턴 명확
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 12
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `backend/Dockerfile` — Multi-stage build 패턴 (동일하게 구성)
  - `backend/docker-compose.yml` — 개발용 compose 패턴
  - `backend/docker-compose.prod.yml` — 프로덕션 compose 패턴 (네트워크 설정)

  **Acceptance Criteria**:

  Agent-Executed QA:
  ```
  Scenario: Docker 빌드 성공
    Tool: Bash
    Steps:
      1. cd bot/ && docker build -t kimitter-bot .
      2. Assert: exit code 0, "Successfully built" 메시지
    Evidence: Build output captured

  Scenario: docker-compose로 봇 서비스 기동
    Tool: Bash
    Steps:
      1. cd bot/ && docker-compose up -d
      2. docker ps | grep kimitter-bot
      3. Assert: 컨테이너 running 상태
      4. curl http://localhost:4000/health
      5. Assert: HTTP 200
      6. docker-compose down
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(bot): add Dockerfile and docker-compose for bot service`
  - Files: `bot/Dockerfile`, `bot/docker-compose.yml`, `bot/.dockerignore`, `bot/.env.example`
  - Pre-commit: `cd bot && docker build -t kimitter-bot .`

---

- [ ] 12. Integration Test — 전체 플로우 검증

  **What to do**:
  - 전체 시스템 통합 테스트:
    1. Backend + Bot Service 동시 실행
    2. 봇 게시글 수동 트리거 → Kimitter API에 게시글 생성 확인
    3. 봇 게시글에 사용자 댓글 작성 → 웹훅 발송 → 봇 답변 생성 확인
    4. 프론트엔드 빌드/타입체크 확인
  - 회귀 테스트:
    - `npm test` (backend/) — 기존 + 새 테스트 모두 PASS
    - `npm test` (bot/) — 전체 PASS
    - `npm test` (frontend/) — 전체 PASS
    - `npx tsc --noEmit` — 3개 프로젝트 모두 에러 없음
    - `npm run build` (backend/) — 성공
  - 문서: `bot/` 디렉토리에 bot-README 수준의 주석/설명은 코드 내 포함

  **Must NOT do**:
  - 프로덕션 배포 (로컬 검증만)
  - 성능/부하 테스트
  - README.md 파일 생성

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 멀티-서비스 통합 검증, 문제 발생 시 깊은 디버깅 필요
  - **Skills**: [`playwright`]
    - `playwright`: 프론트엔드 봇 뱃지 UI 검증

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (최종)
  - **Blocks**: None
  - **Blocked By**: All (Tasks 1-11)

  **References**:

  **All previous task outputs**: 모든 이전 태스크에서 생성된 파일 참조

  **Acceptance Criteria**:

  Agent-Executed QA:
  ```
  Scenario: 봇 게시글 생성 전체 플로우
    Tool: Bash (curl)
    Preconditions: backend (port 3000) + bot (port 4000) 실행, seed 완료
    Steps:
      1. 봇 서비스에서 주식봇 수동 트리거 (POST http://localhost:4000/trigger/stock-bot 또는 직접 함수 호출)
      2. curl http://localhost:3000/api/posts -H "Authorization: Bearer {userToken}"
      3. Assert: 봇 게시글이 피드에 존재
      4. Assert: 게시글 content에 주가 정보 포함
      5. Assert: 게시글 user.role === 'BOT'
      6. Assert: 태그에 '주식' 포함
    Evidence: Response body captured

  Scenario: 봇 댓글 답변 전체 플로우
    Tool: Bash (curl)
    Preconditions: 봇 게시글 존재, backend + bot 실행
    Steps:
      1. curl -X POST http://localhost:3000/api/comments/post/{botPostId} -H "Authorization: Bearer {userToken}" -H "Content-Type: application/json" -d '{"content":"이 기업에 대해 더 알려줘"}'
      2. Assert: HTTP 201 (댓글 생성)
      3. sleep 120 (봇 응답 대기, 최대 2분)
      4. curl http://localhost:3000/api/comments/post/{botPostId} -H "Authorization: Bearer {userToken}"
      5. Assert: 봇 답변 댓글 존재 (user.role === 'BOT')
      6. Assert: 답변 content가 한국어
    Evidence: Response bodies captured

  Scenario: 프론트엔드 봇 뱃지 표시
    Tool: Playwright (playwright skill)
    Preconditions: Expo dev server 실행, 봇 게시글 존재
    Steps:
      1. Navigate to feed
      2. Assert: 봇 게시글에 'BOT' 뱃지 표시
      3. Assert: 일반 유저 게시글에 뱃지 없음
      4. Screenshot: .sisyphus/evidence/task-12-bot-badge-feed.png
    Evidence: .sisyphus/evidence/task-12-bot-badge-feed.png

  Scenario: 전체 회귀 테스트
    Tool: Bash
    Steps:
      1. cd backend/ && npm test
      2. Assert: All tests pass
      3. cd bot/ && npm test
      4. Assert: All tests pass
      5. cd frontend/ && npm test
      6. Assert: All tests pass
      7. cd backend/ && npx tsc --noEmit
      8. Assert: No errors
      9. cd bot/ && npx tsc --noEmit
      10. Assert: No errors
      11. cd frontend/ && npx tsc --noEmit
      12. Assert: No errors
      13. cd backend/ && npm run build
      14. Assert: Build succeeds
    Evidence: Terminal output captured
  ```

  **Commit**: YES (groups all integration test additions)
  - Message: `test: add integration tests for bot system`
  - Pre-commit: `cd backend && npm test && cd ../bot && npm test && cd ../frontend && npm test`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(backend): add BOT role with login block and notification suppression` | schema, authService, notificationService | `npm test && npx tsc --noEmit` |
| 2 | `feat(bot): scaffold bot service with Kimitter API client` | bot/ scaffold, kimitterClient | `cd bot && npm test && npx tsc --noEmit` |
| 3 | `feat(frontend): add BOT role type and badge component` | models.ts, BotBadge.tsx, PostCard.tsx | `cd frontend && npm test && npx tsc --noEmit` |
| 4 | `feat(bot): add OpenAI service with Korean prompt templates` | openaiService, prompts.ts | `cd bot && npm test` |
| 5 | `feat(bot): add Naver News API client` | naverNewsService | `cd bot && npm test` |
| 6 | `feat(bot): add KIS stock API client` | kisStockService | `cd bot && npm test` |
| 7 | `feat(backend): add webhook dispatch for bot post comments` | webhookService, commentService | `npm test && npx tsc --noEmit` |
| 8 | `feat(bot): implement stock, politics, and news bots` | bots/*.ts | `cd bot && npm test` |
| 9 | `feat(bot): add webhook receiver and comment reply handler` | webhook/*.ts | `cd bot && npm test` |
| 10 | `feat(bot): add scheduler and bot user seed script` | scheduler, index.ts, seed | `cd bot && npm test` |
| 11 | `feat(bot): add Dockerfile and docker-compose` | Dockerfile, docker-compose | `docker build` |
| 12 | `test: add integration tests for bot system` | integration tests | All tests pass |

---

## Success Criteria

### Verification Commands
```bash
# Backend — all tests pass
cd backend && npm test            # Expected: All tests pass
cd backend && npx tsc --noEmit    # Expected: No errors
cd backend && npm run build       # Expected: Build succeeds

# Bot Service — all tests pass
cd bot && npm test                # Expected: All tests pass
cd bot && npx tsc --noEmit        # Expected: No errors

# Frontend — all tests pass
cd frontend && npm test           # Expected: All tests pass
cd frontend && npx tsc --noEmit   # Expected: No errors

# Docker — bot service builds
cd bot && docker build -t kimitter-bot .  # Expected: Build succeeds
```

### Final Checklist
- [ ] 3개 봇 (주식/정치/뉴스) 스케줄에 따라 게시글 자동 생성
- [ ] 봇 게시글에 댓글 시 AI 답변 자동 생성 (웹훅 기반, 1-2분 내)
- [ ] BOT role이 Prisma schema에 존재
- [ ] 봇 계정 로그인 차단
- [ ] 봇에게 알림 전송 억제
- [ ] 프론트에서 봇 계정에 BOT 뱃지 + 프로필 이미지 표시
- [ ] 봇 서비스가 별도 Docker 컨테이너로 배포 가능
- [ ] 모든 테스트 PASS (backend, bot, frontend)
- [ ] 타입체크 통과 (3개 프로젝트 모두)
- [ ] 기존 기능 회귀 없음
