# Kimitter 봇 서비스 — 셋업 및 활용 가이드

## 한줄 요약

봇 서비스를 돌리려면 **(1) API 키 발급 → (2) 봇 계정 생성 → (3) .env 설정 → (4) 실행** 이 네 단계를 거치면 된다.

---

## Step 1. 외부 API 키 발급

봇이 콘텐츠를 만들려면 세 가지 외부 API가 필요하다.

### 1-1. OpenAI API Key (필수)

AI가 글을 요약하고 댓글에 답변한다. 이게 없으면 봇이 글을 못 쓴다.

1. https://platform.openai.com 접속 → 로그인
2. Settings → API keys → "Create new secret key"
3. `sk-...` 형태의 키 복사 → 저장
4. Billing에서 결제수단 등록 (GPT-4o-mini 기준 월 ~$2 정도)

### 1-2. Naver Developers API Key (정치봇/뉴스봇용)

뉴스 검색에 사용. 무료, 일 25,000건.

1. https://developers.naver.com 접속 → 로그인
2. Application → 애플리케이션 등록
3. 사용 API에 "검색" 선택
4. `Client ID`와 `Client Secret` 복사

### 1-3. 한국투자증권 Open API Key (주식봇용)

주식 시세 데이터에 사용. 무료.

1. https://apiportal.koreainvestment.com 접속 → 회원가입
2. API 신청 → "KIS Developers" → 모의투자 계좌 개설
3. App Key / App Secret 발급
4. 참고: 모의투자 계좌로도 시세 조회는 가능

---

## Step 2. 봇 계정 생성

봇도 Kimitter 사용자이므로 계정이 필요하다.

### 2-1. 초대코드 발급 (관리자 계정으로)

Kimitter 앱에서 관리자 계정으로 로그인 → 프로필 → "유저 초대하기" 3번 (봇 3개)

또는 curl로:

```bash
# 관리자 로그인해서 토큰 받기
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}' | jq -r '.data.accessToken')

# 초대코드 3개 생성
curl -X POST http://localhost:3000/api/admin/invitation-codes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"stock-bot@kimitter.local"}'

curl -X POST http://localhost:3000/api/admin/invitation-codes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"politics-bot@kimitter.local"}'

curl -X POST http://localhost:3000/api/admin/invitation-codes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"news-bot@kimitter.local"}'
```

응답에서 나온 초대코드 3개를 메모한다.

### 2-2. 봇 계정 등록

seed 스크립트로 비밀번호를 생성하고 등록 curl 명령을 받을 수 있다:

```bash
cd bot
npx ts-node scripts/seedBotUsers.ts
```

출력에 나오는 비밀번호를 **반드시 복사해둔다** (랜덤 64자, 다시 볼 수 없음).

스크립트가 출력하는 curl 명령의 `YOUR_INVITATION_CODE`를 위에서 받은 코드로 바꿔서 실행:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "invitationCode": "abc123",
    "username": "stock-bot",
    "password": "생성된비밀번호",
    "nickname": "📊 주식봇"
  }'

# politics-bot, news-bot도 동일하게
```

### 2-3. BOT role 부여

등록하면 USER role이므로 DB에서 BOT으로 변경:

```bash
# Docker 환경
docker exec -it kimitter-db psql -U family_user -d family_threads -c \
  "UPDATE \"User\" SET role = 'BOT' WHERE username IN ('stock-bot', 'politics-bot', 'news-bot');"

# 로컬 환경
npx prisma db execute --stdin <<< \
  "UPDATE \"User\" SET role = 'BOT' WHERE username IN ('stock-bot', 'politics-bot', 'news-bot');"
```

---

## Step 3. 환경변수 설정

### 3-1. Bot 서비스 (.env)

```bash
cd bot
cp .env.example .env
```

`.env` 파일을 열어서 채운다:

```env
# Kimitter API — 로컬이면 localhost, Docker면 컨테이너 이름
KIMITTER_API_URL=http://localhost:3000/api

# Step 2에서 만든 봇 계정 정보
BOT_STOCK_USERNAME=stock-bot
BOT_STOCK_PASSWORD=여기에_seed_스크립트가_출력한_비밀번호
BOT_POLITICS_USERNAME=politics-bot
BOT_POLITICS_PASSWORD=여기에_seed_스크립트가_출력한_비밀번호
BOT_NEWS_USERNAME=news-bot
BOT_NEWS_PASSWORD=여기에_seed_스크립트가_출력한_비밀번호

# 봇 ON/OFF
BOT_ENABLED=true
BOT_WEBHOOK_PORT=4000

# Step 1에서 받은 API 키들
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

NAVER_CLIENT_ID=발급받은_ID
NAVER_CLIENT_SECRET=발급받은_Secret

KIS_APP_KEY=발급받은_Key
KIS_APP_SECRET=발급받은_Secret
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
```

### 3-2. Backend (.env에 추가)

백엔드가 봇 서비스에 댓글 웹훅을 보내려면 이 한 줄이 필요:

```env
# backend/.env 에 추가
BOT_WEBHOOK_URL=http://localhost:4000/webhook
```

Docker 환경이면:
```env
BOT_WEBHOOK_URL=http://kimitter-bot:4000/webhook
```

---

## Step 4. 실행

### 방법 A: 로컬 개발 (추천 — 처음 테스트할 때)

```bash
# 터미널 1: 백엔드 (이미 돌고 있으면 스킵)
cd backend && npm run dev

# 터미널 2: 봇 서비스
cd bot && npm run dev
```

정상 기동되면 로그에 이렇게 뜬다:
```
info: Starting Kimitter Bot Service...
info: Initializing bot clients...
info: All bot clients initialized and logged in
info: Bot service started on port 4000
info: Scheduler started with 3 jobs
```

### 방법 B: Docker (프로덕션/NAS 배포)

```bash
# 1. 백엔드가 이미 Docker로 돌고 있다면, kimitter-net 네트워크 확인
docker network ls | grep kimitter-net

# 없으면 생성
docker network create kimitter-net

# 기존 backend를 kimitter-net에 연결 (아직 안 되어 있다면)
docker network connect kimitter-net kimitter-backend

# 2. 봇 서비스 빌드 & 실행
cd bot
docker-compose up -d --build

# 3. 로그 확인
docker logs -f kimitter-bot
```

### 헬스체크

```bash
curl http://localhost:4000/health
# 응답: {"status":"ok"}
```

---

## 자동 게시 스케줄

봇은 설정만 해두면 알아서 돌아간다:

| 봇 | 스케줄 | 시간 (KST) | 내용 |
|----|--------|-----------|------|
| 🏛️ 정치봇 | 매일 | 오전 8:00 | 전날 정치 뉴스 요약 + 출처 URL |
| 📰 뉴스봇 | 매일 | 오전 8:01 | 전날 종합 뉴스 요약 + 출처 URL |
| 📊 주식봇 | 매주 월요일 | 오전 8:02 | 트렌딩 종목 분석 + 주가 정보 |

- 중복 게시 방지: 당일 이미 게시했으면 자동 스킵
- 외부 API 실패: 로그만 남기고 스킵 (서비스 크래시 안 함)
- `BOT_ENABLED=false`로 설정하면 스케줄 전체 비활성화

---

## 댓글 Q&A (자동 답변)

봇이 쓴 글에 댓글을 달면 AI가 자동으로 답변한다.

**동작 흐름:**
1. 사용자가 봇 게시글에 댓글 작성
2. Backend가 웹훅으로 봇 서비스에 알림 전송
3. 봇 서비스가 게시글 + 댓글 스레드 맥락을 수집
4. GPT-4o-mini가 봇 성격에 맞는 답변 생성 (주식봇은 주식 전문가 톤, 정치봇은 중립적 톤, 뉴스봇은 기자 톤)
5. 봇이 답글 작성

**안전장치:**
- 봇끼리는 대화 안 함 (BOT→BOT 차단)
- AI 실패 시 답변 스킵 (에러 로그만)
- 봇 계정으로는 앱 로그인 불가 (BOT role 로그인 차단)

---

## 일상적인 관리

### 봇 일시 중지

```bash
# .env에서 변경
BOT_ENABLED=false

# 서비스 재시작
docker restart kimitter-bot   # Docker
# 또는 Ctrl+C 후 npm run dev  # 로컬
```

### 로그 확인

```bash
# Docker
docker logs kimitter-bot --tail 50
docker logs kimitter-bot -f    # 실시간

# 로컬은 터미널에 바로 출력됨
```

### 봇 서비스만 업데이트

```bash
cd bot
docker-compose down
docker-compose up -d --build
```

### OpenAI 비용 모니터링

https://platform.openai.com/usage 에서 확인. GPT-4o-mini 기준:
- 게시글 생성: ~500 토큰/건 → 하루 3건이면 ~$0.01
- 댓글 답변: ~300 토큰/건
- 월 예상: 가족 4명이 활발히 댓글 달아도 **$2~5** 수준

---

## NAS (Synology) 배포

기존 백엔드와 같은 방식으로 NAS에 올릴 수 있다:

```bash
# 1. Mac에서 이미지 빌드 & Docker Hub Push
cd bot
docker buildx build --platform linux/amd64 --no-cache \
  -t dusehd1/kimitter-bot:latest --push .

# 2. NAS에서
# docker-compose.yml의 build: . 를 image: dusehd1/kimitter-bot:latest 로 변경
# Container Manager에서 프로젝트 빌드 클릭
```

NAS용 `docker-compose.yml` 수정본:
```yaml
version: '3.8'
services:
  bot:
    image: dusehd1/kimitter-bot:latest   # build: . 대신 이미지 사용
    container_name: kimitter-bot
    restart: unless-stopped
    ports:
      - '4000:4000'
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - KIMITTER_API_URL=http://kimitter-backend:3000/api
    networks:
      - kimitter-net

networks:
  kimitter-net:
    external: true
```

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `Login failed for stock-bot` | 봇 계정 미생성 또는 비밀번호 불일치 | Step 2 다시 진행, .env 비밀번호 확인 |
| `Bot scheduler disabled` | `BOT_ENABLED=false` | .env에서 `BOT_ENABLED=true`로 변경 |
| 글은 올라오는데 댓글 답변이 안 됨 | Backend에 `BOT_WEBHOOK_URL` 미설정 | backend/.env에 `BOT_WEBHOOK_URL=http://localhost:4000/webhook` 추가 후 재시작 |
| `OPENAI_API_KEY is not set` | OpenAI 키 누락 | .env에 키 입력 |
| 뉴스봇이 빈 글을 올림 | Naver API 키 미설정 | NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 확인 |
| 주식봇이 글을 안 올림 | KIS API 키 미설정 또는 월요일이 아님 | 주식봇은 매주 월요일만 동작 |
| Docker에서 봇→백엔드 연결 실패 | 같은 Docker 네트워크에 없음 | `docker network connect kimitter-net kimitter-backend` |
| `ECONNREFUSED` | 백엔드가 안 돌고 있음 | 백엔드 먼저 기동 |

---

## 요약 체크리스트

- [ ] OpenAI API Key 발급 (`sk-...`)
- [ ] Naver Developers API Key 발급 (Client ID/Secret)
- [ ] 한국투자증권 API Key 발급 (App Key/Secret)
- [ ] 봇 계정 3개 생성 (초대코드 → 회원가입 → BOT role 변경)
- [ ] `bot/.env` 작성 (API 키 + 봇 비밀번호)
- [ ] `backend/.env`에 `BOT_WEBHOOK_URL` 추가
- [ ] 봇 서비스 실행 (`npm run dev` 또는 `docker-compose up -d`)
- [ ] 헬스체크 확인 (`curl localhost:4000/health`)
- [ ] 다음날 아침 8시에 글이 올라오는지 확인
