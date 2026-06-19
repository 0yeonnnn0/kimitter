# Kimitter

> 가족 4명만을 위한 폐쇄형 SNS. 2주 동안 기획, 모바일 앱, 백엔드, 봇, NAS 배포 자동화까지 혼자 구현한 실사용 프로젝트입니다.

Kimitter는 가족 카톡방에서 사진과 이야기가 금방 묻히는 문제를 해결하기 위해 만든 **가족 전용 SNS 앱**입니다. 초대 코드가 있어야 가입할 수 있고, 게시글·사진·GIF·동영상·댓글·알림·월별 미디어 갤러리·AI 봇 게시물을 지원합니다. UI는 Threads의 2-column 피드를 참고했고, 서비스는 Synology NAS + Docker + Cloudflare Tunnel 위에서 운영됩니다.

- **프로젝트 성격**: 가족용 실서비스 + Luminir 모바일/백엔드 기술 스택 파일럿
- **개발 기간**: 2026.02.08 ~ 2026.02.21, 약 2주 집중 개발
- **사용자**: 가족 4명
- **서비스 도메인**: `kimitter.yeonnnn.xyz`
- **코드 규모**: TypeScript 112 files / 약 5.4K LOC, 전체 278 files
- **테스트**: Backend 64 tests + Bot 75 tests = 139 tests

---

## 목차

- [핵심 기능](#핵심-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [프로젝트 구조](#프로젝트-구조)
- [로컬 실행](#로컬-실행)
- [환경변수](#환경변수)
- [테스트와 검증](#테스트와-검증)
- [배포와 운영](#배포와-운영)
- [주요 구현 포인트](#주요-구현-포인트)
- [회고](#회고)
- [TODO](#todo)

---

## 핵심 기능

### 1. 초대 코드 기반 폐쇄형 SNS

- 관리자만 초대 코드를 생성할 수 있습니다.
- 초대 코드 없이는 회원가입할 수 없어 가족 전용 공간을 유지합니다.
- 사용자 역할은 `USER`, `ADMIN`, `BOT`으로 분리했습니다.

### 2. Threads 스타일 홈 피드

- 아바타 열과 콘텐츠 열을 분리한 2-column 레이아웃
- `FlatList` 기반 무한 스크롤
- Pull-to-refresh
- 상단 “새로운 소식이 있나요?” compose prompt
- 좋아요 낙관적 업데이트
- 게시물 상세, 댓글, 대댓글 지원

### 3. 미디어 업로드와 갤러리

- 사진, GIF, 동영상 업로드
- 업로드 전 이미지 자동 압축
  - 1920px 리사이징
  - JPEG 70% 압축
  - HEIC → JPEG 변환
- 원본 비율을 유지하는 미디어 갤러리
- 월별 미디어 갤러리로 가족 사진을 다시 보기 쉽게 구성

### 4. 알림과 푸시

- 좋아요, 댓글, 답글, 멘션, 커스텀 알림
- Expo Push Notification 연동
- 글 작성 시 “알림 보내기” 모드로 가족 전체에게 브로드캐스트 가능
- 읽음 처리와 30일 지난 알림 자동 정리

### 5. 검색과 프로필

- 태그 검색 / 유저 검색 모드 전환
- 프로필 탭: 스레드 / 답글 / 미디어
- 프로필 편집, 프로필 이미지 확대 보기
- 유저별 캘린더 색상 관리

### 6. 가족 피드를 채우는 봇 서비스

백엔드와 분리된 독립 봇 서비스가 Kimitter API를 통해 자동 게시물을 작성합니다.

- **뉴스봇**: 매일 09:00 KST, 네이버 뉴스 API + OpenAI 요약 게시
- **주식봇**: 매주 토요일 08:02 KST, KIS API 기반 거래량 TOP 5 게시
- **댓글 자동 응답**: 봇 게시물에 가족이 댓글을 달면 OpenAI로 답글 생성
- **무한 루프 방지**: BOT이 다른 BOT 댓글에는 응답하지 않도록 차단
- **Webhook 기반**: 백엔드가 댓글 생성 이벤트를 봇 서비스로 전달

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Mobile | React Native, Expo SDK 54, Expo Router, expo-dev-client |
| State | Zustand |
| API Client | Axios + 401 refresh interceptor |
| Secure Storage | Expo SecureStore |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 15, Prisma ORM |
| Auth | JWT Access Token + Refresh Token, bcryptjs |
| Validation | Joi |
| Upload | Multer, NAS local filesystem |
| Notification | expo-notifications, expo-server-sdk |
| Bot | Node.js, TypeScript, OpenAI, KIS API, Naver News API |
| Infra | Docker, Docker Compose, Synology NAS |
| External Access | Cloudflare Tunnel |
| CI/CD | GitHub Actions, Docker Hub |
| Test | Jest, ts-jest, supertest |
| Package Manager | npm |

---

## 아키텍처

```text
[Expo / React Native App]
        |
        | HTTPS
        v
https://kimitter.yeonnnn.xyz
        |
        v
[Cloudflare Tunnel]
        |
        v
[Express Backend :3000] ───── [PostgreSQL :5432]
        |
        | webhook: comment created
        v
[Bot Service :4000]
        |
        ├── OpenAI: 뉴스 요약 / 댓글 답변 생성
        ├── Naver News API: 주요 뉴스 수집
        └── KIS API: 국내 주식 거래량 데이터 수집
```

### 배포 흐름

```text
코드 수정
  → git push main
  → GitHub Actions
  → Docker Hub 이미지 빌드 & push
  → NAS Task Scheduler가 새 이미지 감지
  → docker compose pull & restart
  → 5~10분 내 프로덕션 반영
```

---

## 프로젝트 구조

```text
kimitter/
├── backend/                    # Express API 서버
│   ├── src/
│   │   ├── config/             # DB, Multer, JWT, env 설정
│   │   ├── controllers/        # 요청/응답 처리 계층
│   │   ├── middleware/         # auth, admin, validation, errorHandler
│   │   ├── routes/             # REST API 라우트
│   │   ├── services/           # 비즈니스 로직
│   │   ├── types/              # TypeScript 타입
│   │   └── utils/              # errors, jwt, logger 등
│   ├── prisma/schema.prisma    # DB 스키마
│   ├── scripts/backup-db.sh    # PostgreSQL 백업 스크립트
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/                   # Expo / React Native 앱
│   ├── app/                    # Expo Router 파일 기반 라우팅
│   │   ├── (auth)/             # 로그인, 초대코드, 회원가입
│   │   ├── (tabs)/             # 홈, 검색, 작성, 활동, 프로필
│   │   ├── [postId]/           # 게시물 상세
│   │   └── user/[userId].tsx   # 유저 프로필
│   ├── src/
│   │   ├── components/         # PostCard, BottomSheet, MediaGallery 등
│   │   ├── services/           # Axios API 클라이언트
│   │   ├── stores/             # Zustand stores
│   │   ├── types/              # API / 모델 타입
│   │   └── utils/
│   └── eas.json
│
├── bot/                        # 독립 봇 서비스
│   ├── src/
│   │   ├── api/                # Kimitter API client
│   │   ├── bots/               # stockBot, newsBot
│   │   ├── services/           # OpenAI, KIS, Naver services
│   │   ├── webhook/            # 댓글 webhook 수신 서버
│   │   ├── scheduler.ts        # cron 스케줄러
│   │   └── index.ts
│   └── Dockerfile
│
├── .github/workflows/          # Docker 이미지 자동 빌드/push
├── log/                        # 개발 변경 로그 100+개
├── AGENTS.md                   # AI agent 작업 가이드
└── README.md
```

---

## 로컬 실행

### 사전 요구사항

- Node.js 20+
- npm
- Docker / Docker Compose
- iOS Simulator 또는 Android Emulator, 또는 Expo development build가 설치된 실기기
- 선택: EAS CLI

### 1. 저장소 클론

```bash
git clone https://github.com/0yeonnnn0/kimitter.git
cd kimitter
```

### 2. 백엔드 실행

```bash
cd backend
npm install
cp .env.example .env

# PostgreSQL + backend 컨테이너 실행
docker compose up -d --build

# Prisma Client 생성 / 마이그레이션이 필요한 경우
npx prisma generate
npx prisma migrate dev
```

개발 서버를 로컬 Node.js로 띄우고 싶다면 DB만 Docker로 실행한 뒤 `npm run dev`를 사용합니다.

```bash
cd backend
docker compose up -d postgres
npm run dev
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
cp .env.example .env
npm run start
```

실기기에서 테스트할 때는 `frontend/.env`의 API 주소를 `localhost`가 아닌 개발 머신의 LAN IP로 바꿔야 합니다.

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

네이티브 모듈, 특히 푸시 알림까지 테스트하려면 Expo Go 대신 development build를 사용합니다.

```bash
cd frontend
npx expo start --dev-client
```

### 4. 봇 서비스 실행

```bash
cd bot
npm install
cp .env.example .env
npm run dev
```

봇 서비스는 백엔드 API와 통신하므로 `KIMITTER_API_URL`과 봇 계정 정보가 먼저 준비되어 있어야 합니다.

---

## 환경변수

실제 secret은 커밋하지 않습니다. 각 패키지의 `.env.example`을 복사해서 사용합니다.

| 파일 | 설명 |
|---|---|
| `backend/.env.example` | DB URL, JWT secret, 업로드 경로, Expo push token, webhook URL |
| `backend/.env.production.example` | NAS/프로덕션용 백엔드 환경변수 예시 |
| `frontend/.env.example` | `EXPO_PUBLIC_API_URL` |
| `bot/.env.example` | Kimitter API URL, bot 계정, OpenAI, Naver, KIS API 설정 |

### 주요 백엔드 환경변수

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://family_user:password@localhost:5432/family_threads
JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
UPLOAD_DIR=./uploads
BOT_WEBHOOK_URL=http://localhost:4000/webhook
```

### 주요 봇 환경변수

```env
KIMITTER_API_URL=http://localhost:3000/api
BOT_ENABLED=true
BOT_WEBHOOK_PORT=4000
OPENAI_API_KEY=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
KIS_APP_KEY=...
KIS_APP_SECRET=...
```

---

## 테스트와 검증

### Backend

```bash
cd backend
npm test
npm run build
npm run lint
```

현황:

- 11 suites
- 64 tests
- 인증, 게시물, 댓글, 좋아요, 알림, 태그, 유저, webhook service, JWT 유틸리티 커버

### Bot

```bash
cd bot
npm test
npm run build
npm run type-check
```

현황:

- 9 suites
- 75 tests
- Kimitter API client, 뉴스봇, 주식봇, OpenAI service, KIS service, Naver service, scheduler, webhook 커버

### Frontend

```bash
cd frontend
npx tsc --noEmit
npm run start
```

현재 프론트엔드는 타입 검사 중심입니다. 컴포넌트 테스트는 향후 개선 항목입니다.

---

## 배포와 운영

### GitHub Actions

`main` 브랜치에 push하면 변경 경로에 따라 Docker 이미지가 자동으로 빌드됩니다.

| Workflow | Trigger | Image |
|---|---|---|
| `.github/workflows/deploy-backend.yml` | `backend/**` | `dusehd1/kimitter-backend:latest` |
| `.github/workflows/deploy-bot.yml` | `bot/**` | `dusehd1/kimitter-bot:latest` |

필요한 GitHub Secrets:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

### Synology NAS

프로덕션은 Synology NAS의 Container Manager에서 Docker Compose로 운영합니다.

```text
/volume1/docker/kimitter/
├── docker-compose.yml
├── .env.production
├── postgres/
├── uploads/
├── backups/
└── backup-db.sh
```

운영 컨테이너:

- `kimitter-db`
- `kimitter-backend`
- `kimitter-bot`
- `kimitter-expo-dev`
- `cloudflared`

### Cloudflare Tunnel

집 네트워크가 이중 NAT 환경이라 포트포워딩 대신 Cloudflare Tunnel을 사용합니다.

장점:

- 포트포워딩 불필요
- HTTPS 자동 적용
- 유동 IP 대응
- 집 IP 비노출
- Cloudflare 레벨의 기본 보호 활용

### DB 백업

NAS Task Scheduler가 매일 새벽 2시에 `pg_dump` 백업을 수행합니다.

```bash
# 수동 백업
sudo /volume1/docker/kimitter/backup-db.sh

# 백업 파일 예시
/volume1/docker/kimitter/backups/db_YYYYMMDD_HHMMSS.sql.gz
```

30일이 지난 백업은 자동 삭제됩니다.

---

## 주요 구현 포인트

### Expo Router 기반 모바일 라우팅

`app/` 디렉터리 구조가 그대로 네비게이션이 됩니다.

```text
app/
├── _layout.tsx
├── (auth)/login.tsx
├── (auth)/register.tsx
├── (tabs)/index.tsx
├── (tabs)/search.tsx
├── (tabs)/activity.tsx
├── (tabs)/profile.tsx
├── [postId]/index.tsx
└── user/[userId].tsx
```

인증 상태에 따라 `(auth)` 또는 `(tabs)` 그룹으로 분기하고, 알림에서 게시물 상세로 이동할 때 deep linking 구조를 활용할 수 있습니다.

### Axios 401 refresh queue

여러 API 요청이 동시에 401을 받았을 때 refresh 요청이 중복으로 발생하지 않도록 큐를 둡니다.

- `isRefreshing`으로 refresh 진행 여부 관리
- refresh 중 실패한 요청은 queue에서 대기
- 새 access token 발급 후 대기 요청 일괄 재시도
- `_retry` 플래그로 무한 루프 방지

### JWT 이중 토큰 + SecureStore

- Access Token: 1시간, API 인증용
- Refresh Token: 7일, DB 저장 및 rotation
- 모바일에서는 Expo SecureStore에 token 저장
- 앱 cold start 시 refresh token 기반으로 세션 복원

### Controller → Service → Prisma

백엔드는 컨트롤러를 얇게 유지하고, 비즈니스 로직을 service 계층에 둡니다.

```text
routes → middleware → controller → service → Prisma
```

이 구조 덕분에 service 단위 테스트를 작성하기 쉬웠고, 백엔드 핵심 로직 대부분을 Jest로 검증할 수 있었습니다.

### 봇 서비스 분리

뉴스봇/주식봇은 백엔드 내부 cron이 아니라 별도 서비스입니다.

- 봇 장애가 메인 API 장애로 번지지 않음
- 봇만 독립적으로 배포 가능
- OpenAI, KIS, Naver API 변경 영향을 격리
- HTTP API + webhook으로만 백엔드와 연결

### NAS 환경에서 겪은 문제 해결

- Synology Container Manager에서 컨테이너 간 DNS 통신 문제
  - 해결: `kimitter-net` 명시적 Docker network 생성
- Alpine 기반 Node 이미지에서 Prisma OpenSSL 호환성 문제
  - 해결: `node:20-slim` Debian 기반 이미지 사용
- 수동 배포 반복 문제
  - 해결: GitHub Actions + NAS Task Scheduler 자동 pull/restart

---

## 데이터베이스 모델

Prisma 기준 주요 모델은 다음과 같습니다.

| Model | 역할 |
|---|---|
| `User` | 사용자, 역할, 프로필, 캘린더 색상 |
| `InvitationCode` | 초대 코드 |
| `RefreshToken` | refresh token 저장 및 세션 관리 |
| `Post` | 게시물 |
| `PostMedia` | 사진/GIF/동영상 미디어 |
| `Tag`, `PostTag` | 태그와 게시물 태그 연결 |
| `Comment` | 댓글과 대댓글 |
| `Like` | 게시물/댓글 좋아요 |
| `Notification` | 알림 |
| `PushToken` | Expo push token |
| `Schedule` | 가족 일정/캘린더 |

---

## API 개요

| 그룹 | 주요 엔드포인트 |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Posts | `GET /posts`, `POST /posts`, `GET /posts/:id`, `PUT /posts/:id`, `DELETE /posts/:id` |
| Comments | `GET /comments/post/:id`, `POST /comments/post/:id`, `POST /comments/:id/replies` |
| Likes | `POST /posts/:id/like`, `DELETE /posts/:id/like`, `POST /comments/:id/like` |
| Tags | `GET /tags`, `GET /tags/popular`, `GET /tags/search`, `GET /tags/:name/posts` |
| Users | `GET /users/me`, `PUT /users/me`, `GET /users/:id`, `GET /users/:id/posts` |
| Notifications | `GET /notifications`, `GET /notifications/unread`, `PUT /notifications/read-all` |
| Admin | `GET /admin/users`, `PUT /admin/users/:id`, `POST /admin/invitation-codes` |
| Activity | `GET /activity` |

---

## 개발 명령어 요약

### Backend

```bash
cd backend
npm run dev
npm run build
npm start
npm test
npm run lint
npx prisma studio
npx prisma migrate dev
```

### Frontend

```bash
cd frontend
npm run start
npm run ios
npm run android
npm run web
npx tsc --noEmit
npx expo start --dev-client
```

### Bot

```bash
cd bot
npm run dev
npm run build
npm start
npm test
npm run type-check
npx ts-node scripts/testStockBot.ts
```

---

## 회고

### 잘한 점

- **실사용자를 두고 만든 것**: 가족이 직접 쓰면서 발견한 불편함을 바로 개선할 수 있었습니다.
- **Expo 선택**: 푸시 알림, 이미지 선택, 라우팅, development build까지 빠르게 연결할 수 있었습니다.
- **봇 서비스 분리**: AI/외부 API 기능을 메인 백엔드와 격리해 운영 안정성을 높였습니다.
- **배포 자동화**: `git push` 이후 NAS 반영까지 자동화해 운영 부담을 줄였습니다.
- **변경 로그 기록**: `log/`에 100개 이상의 개발 기록을 남겨 회고와 면접 준비에 활용할 수 있었습니다.

### 아쉬운 점

- 프론트엔드 자동 테스트가 부족합니다.
- 가족 전용 서비스라는 이유로 CORS, Rate Limiting 같은 방어를 뒤로 미뤘습니다.
- Admin UI, 게시물 수정, 댓글 좋아요 UI 등 아직 남은 기능이 있습니다.

### 배운 점

- 작은 서비스라도 실제 사용자가 있으면 우선순위가 명확해집니다.
- NAS + Docker 배포는 비용이 낮지만 네트워크, 이미지 호환성, 백업까지 고려해야 합니다.
- AI 봇은 단순 자동 게시를 넘어 가족이 댓글로 상호작용하는 콘텐츠가 될 수 있습니다.
- Webhook은 polling보다 단순하고 즉각적인 이벤트 기반 통합 방식이었습니다.

---

## TODO

- [ ] Admin UI 화면 구현
- [ ] 댓글/답글 좋아요 UI
- [ ] 게시물 수정 기능 프론트엔드 구현
- [ ] 동영상 재생 UI 개선
- [ ] 게시물 상세 페이지 2-column 레이아웃 적용
- [ ] CORS allowlist 적용
- [ ] Rate Limiting 적용
- [ ] 프론트엔드 컴포넌트 테스트 추가
- [ ] Nginx 리버스 프록시 검토, 현재는 Cloudflare Tunnel로 대체

---

## License

개인/가족용 사이드 프로젝트입니다. 별도 라이선스가 필요하면 `LICENSE` 파일을 추가하세요.
