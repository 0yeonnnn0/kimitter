# Kimitter 봇 서비스 — 셋업, 로컬 테스트, NAS 배포 가이드

## 환경 요약

| 환경 | 설명 |
|------|------|
| **개발** | MacBook (Docker 용량 부족 → Node.js로 직접 실행) |
| **프로덕션** | Synology DS225+ NAS (Docker Container Manager) |
| **백엔드** | NAS에서 Docker로 운영 중 (`kimitter-backend:3000`) |
| **도메인** | `kimitter.yeonnnn.xyz` (Cloudflare Tunnel) |

---

## 전체 진행 순서

```
Phase 1: 준비
  ├─ API 키 3개 발급 (OpenAI, Naver, KIS)
  └─ NAS에서 봇 계정 3개 생성

Phase 2: 로컬 테스트 (MacBook, Docker 없이)
  ├─ bot/.env 작성 (NAS 백엔드에 직접 연결)
  ├─ npm run dev로 봇 실행
  └─ 수동 테스트 (글 올라오는지 확인)

Phase 3: NAS 배포 (소스 직접 복사 → NAS에서 빌드)
  ├─ rsync/scp로 소스를 NAS에 복사
  ├─ NAS에서 docker compose build
  └─ 컨테이너 실행 + 댓글 Q&A 테스트
```

---

## Phase 1: 준비

### 1-1. 외부 API 키 발급

| API | 사이트 | 받을 것 | 비용 |
|-----|--------|---------|------|
| OpenAI | https://platform.openai.com | `sk-...` 키 | ~$2/월 |
| Naver | https://developers.naver.com | Client ID / Secret | 무료 |
| 한국투자증권 | https://apiportal.koreainvestment.com | App Key / Secret | 무료 |

**OpenAI**: Settings → API keys → Create new secret key → Billing에 결제수단 등록
**Naver**: Application 등록 → 사용 API에 "검색" 선택
**KIS**: 회원가입 → KIS Developers → 모의투자 계좌 개설 → API 신청

### 1-2. NAS에서 봇 계정 생성

봇도 Kimitter 사용자이므로 계정이 필요하다. NAS에 SSH로 접속해서 진행.

```bash
ssh admin@NAS_IP
```

**초대코드 발급:**
```bash
# 관리자 토큰 받기
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"실제관리자비밀번호"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 초대코드 3개 생성
for EMAIL in stock-bot@kimitter.local politics-bot@kimitter.local news-bot@kimitter.local; do
  CODE=$(curl -s -X POST http://localhost:3000/api/admin/invitation-codes \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\"}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['data']['code'])")
  echo "$EMAIL → $CODE"
done
```

**봇 회원가입 + BOT role 부여:**
```bash
# 비밀번호 생성 (반드시 메모!)
STOCK_PW=$(openssl rand -hex 32)
POLITICS_PW=$(openssl rand -hex 32)
NEWS_PW=$(openssl rand -hex 32)

echo "=== 이 비밀번호를 반드시 저장하세요 ==="
echo "stock-bot:    $STOCK_PW"
echo "politics-bot: $POLITICS_PW"
echo "news-bot:     $NEWS_PW"
echo "============================================"

# 회원가입 (위에서 받은 초대코드로 바꿔서 실행)
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"invitationCode\":\"초대코드1\",\"username\":\"stock-bot\",\"password\":\"$STOCK_PW\",\"nickname\":\"📊 주식봇\"}"

curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"invitationCode\":\"초대코드2\",\"username\":\"politics-bot\",\"password\":\"$POLITICS_PW\",\"nickname\":\"🏛️ 정치봇\"}"

curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"invitationCode\":\"초대코드3\",\"username\":\"news-bot\",\"password\":\"$NEWS_PW\",\"nickname\":\"📰 뉴스봇\"}"

# BOT role 부여
docker exec -it kimitter-db psql -U family_user -d family_threads -c \
  "UPDATE \"User\" SET role = 'BOT' WHERE username IN ('stock-bot', 'politics-bot', 'news-bot');"

# 확인
docker exec -it kimitter-db psql -U family_user -d family_threads -c \
  "SELECT username, nickname, role FROM \"User\" WHERE role = 'BOT';"
```

---

## Phase 2: 로컬 테스트 (MacBook, Docker 없이)

`npm run dev`로 봇 서비스를 실행하고, NAS에서 돌고 있는 백엔드에 Cloudflare Tunnel로 직접 연결한다. 맥북에 Docker나 DB를 띄울 필요 없음.

### 2-1. bot/.env 작성

```bash
cd bot
cp .env.example .env
```

`.env`를 편집:
```env
# ★ NAS 백엔드에 직접 연결 (Cloudflare Tunnel 경유)
KIMITTER_API_URL=https://kimitter.yeonnnn.xyz/api

# Phase 1에서 만든 봇 계정
BOT_STOCK_USERNAME=stock-bot
BOT_STOCK_PASSWORD=Phase1에서_메모한_비밀번호
BOT_POLITICS_USERNAME=politics-bot
BOT_POLITICS_PASSWORD=Phase1에서_메모한_비밀번호
BOT_NEWS_USERNAME=news-bot
BOT_NEWS_PASSWORD=Phase1에서_메모한_비밀번호

# 봇 서비스
BOT_ENABLED=true
BOT_WEBHOOK_PORT=4000

# API 키
OPENAI_API_KEY=sk-실제키
OPENAI_MODEL=gpt-4o-mini

NAVER_CLIENT_ID=실제ID
NAVER_CLIENT_SECRET=실제Secret

KIS_APP_KEY=실제Key
KIS_APP_SECRET=실제Secret
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
```

> **핵심**: `KIMITTER_API_URL=https://kimitter.yeonnnn.xyz/api`로 NAS 백엔드에 직접 연결. 로컬에 DB/백엔드 불필요.

### 2-2. 봇 서비스 실행

```bash
cd bot
npm run dev
```

정상이면:
```
info: Starting Kimitter Bot Service...
info: Initializing bot clients...
info: All bot clients initialized and logged in
info: Bot service started on port 4000
info: Scheduler started with 3 jobs
```

> 로그인 실패(`Login failed`)가 뜨면 → 비밀번호 오타이거나 BOT role 미부여

### 2-3. 수동 테스트 (글 올리기)

봇은 스케줄(아침 8시)에 맞춰 자동으로 글을 올리지만, 지금 바로 테스트하려면:

```bash
# bot/ 디렉토리에서 실행 — 정치봇으로 테스트
npx ts-node -e "
const { KimitterClient } = require('./src/api/kimitterClient');
const { PoliticsBot } = require('./src/bots/politicsBot');
const { config } = require('./src/config/environment');

async function test() {
  const client = new KimitterClient({
    apiUrl: config.kimitter.apiUrl,
    username: config.bots.politics.username,
    password: config.bots.politics.password,
  });
  await client.login();
  console.log('로그인 성공!');

  const bot = new PoliticsBot(client);
  await bot.generatePost();
  console.log('게시글 생성 완료!');
}
test().catch(console.error);
"
```

성공하면 Kimitter 앱을 열어서 피드에 정치봇 글이 뜨는지 확인.

### 2-4. 댓글 Q&A는 로컬에서 테스트 불가

댓글 답변은 **NAS 백엔드 → 봇 서비스**로 웹훅을 보내야 동작한다. 맥북에서 봇을 돌리면 NAS가 맥북의 4000번 포트에 접근할 수 없으므로, 댓글 Q&A는 Phase 3(NAS 배포) 후에 테스트한다.

> **로컬에서 확인할 수 있는 것**: 봇 로그인, 게시글 자동 생성, 스케줄러 동작
> **NAS 배포 후 확인할 것**: 댓글 Q&A (웹훅 기반)

---

## Phase 3: NAS 배포

Docker Hub를 거치지 않고, **소스를 NAS에 직접 복사해서 NAS에서 빌드**한다.
(Synology NAS는 이미 amd64이므로 크로스 빌드 불필요)

### 3-1. 소스 파일을 NAS로 복사

```bash
# MacBook에서 실행
rsync -avz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='coverage' \
  bot/ admin@NAS_IP:/volume1/docker/kimitter-bot/source/
```

또는 tar로:
```bash
cd bot
tar czf /tmp/kimitter-bot.tar.gz \
  --exclude=node_modules --exclude=dist --exclude=.env --exclude=coverage .

scp /tmp/kimitter-bot.tar.gz admin@NAS_IP:/volume1/docker/kimitter-bot/
```

### 3-2. NAS에서 압축 해제 (tar로 보낸 경우)

```bash
ssh admin@NAS_IP

mkdir -p /volume1/docker/kimitter-bot/source
cd /volume1/docker/kimitter-bot
tar xzf kimitter-bot.tar.gz -C source/
```

### 3-3. docker-compose.prod.yml 작성

NAS에서 직접 빌드하므로 `build:` 사용 (Docker Hub 이미지 아님):

```bash
cat > /volume1/docker/kimitter-bot/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  bot:
    build: ./source
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
EOF
```

### 3-4. .env 작성

```bash
cat > /volume1/docker/kimitter-bot/.env << 'ENVEOF'
# Docker 네트워크 내부 통신 (컨테이너 이름으로 접근)
KIMITTER_API_URL=http://kimitter-backend:3000/api

# 봇 계정 (Phase 1에서 생성한 비밀번호)
BOT_STOCK_USERNAME=stock-bot
BOT_STOCK_PASSWORD=여기에_비밀번호
BOT_POLITICS_USERNAME=politics-bot
BOT_POLITICS_PASSWORD=여기에_비밀번호
BOT_NEWS_USERNAME=news-bot
BOT_NEWS_PASSWORD=여기에_비밀번호

# 봇 서비스
BOT_ENABLED=true
BOT_WEBHOOK_PORT=4000

# OpenAI
OPENAI_API_KEY=sk-여기에_실제키
OPENAI_MODEL=gpt-4o-mini

# Naver News API
NAVER_CLIENT_ID=여기에_실제ID
NAVER_CLIENT_SECRET=여기에_실제Secret

# KIS Stock API
KIS_APP_KEY=여기에_실제Key
KIS_APP_SECRET=여기에_실제Secret
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
ENVEOF

# 실제 값 입력
vi /volume1/docker/kimitter-bot/.env
```

### 3-5. 백엔드에 웹훅 URL 추가

백엔드가 봇 게시글에 달린 댓글을 봇에게 알려주는 데 필요:

```bash
cd /volume1/docker/kimitter

# 기존 .env.production에 한 줄 추가
echo "BOT_WEBHOOK_URL=http://kimitter-bot:4000/webhook" >> .env.production

# 백엔드 재시작
docker compose -f docker-compose.prod.yml restart backend
```

### 3-6. 봇 컨테이너 빌드 & 실행

```bash
cd /volume1/docker/kimitter-bot

# 빌드 + 실행 (NAS에서 직접 빌드, Docker Hub 불필요)
docker compose -f docker-compose.prod.yml up -d --build

# 로그 확인
docker logs -f kimitter-bot
```

정상:
```
info: Starting Kimitter Bot Service...
info: All bot clients initialized and logged in
info: Bot service started on port 4000
info: Scheduler started with 3 jobs
```

### 3-7. 헬스체크

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

---

## 배포 후 확인

### 자동 게시 확인

| 봇 | 언제 | 확인 방법 |
|----|------|----------|
| 🏛️ 정치봇 | 매일 오전 8:00 KST | 앱 피드에서 확인 |
| 📰 뉴스봇 | 매일 오전 8:01 KST | 앱 피드에서 확인 |
| 📊 주식봇 | 매주 월요일 8:02 KST | 앱 피드에서 확인 |

### 댓글 Q&A 확인

1. 앱에서 봇이 쓴 글에 댓글 달기
2. 1~2분 기다리면 봇이 자동으로 답글 작성
3. 로그: `docker logs kimitter-bot --tail 20`

### 컨테이너 상태 확인

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

```
NAMES               STATUS          PORTS
kimitter-bot        Up 2 minutes    0.0.0.0:4000->4000/tcp
kimitter-backend    Up 3 days       0.0.0.0:3000->3000/tcp
kimitter-db         Up 3 days       5432/tcp
```

---

## 업데이트 방법 (코드 수정 후)

```bash
# 1. MacBook에서 수정된 소스를 NAS로 다시 복사
rsync -avz \
  --exclude='node_modules' --exclude='dist' --exclude='.env' --exclude='coverage' \
  bot/ admin@NAS_IP:/volume1/docker/kimitter-bot/source/

# 2. NAS에서 재빌드
ssh admin@NAS_IP
cd /volume1/docker/kimitter-bot
docker compose -f docker-compose.prod.yml up -d --build
```

---

## NAS 파일 구조 (최종)

```
/volume1/docker/
├── kimitter/                          # 기존 백엔드
│   ├── docker-compose.prod.yml        # postgres + backend
│   ├── .env.production                # ← BOT_WEBHOOK_URL 추가됨
│   ├── postgres/
│   ├── uploads/
│   └── backups/
│
└── kimitter-bot/                      # 봇 서비스
    ├── docker-compose.prod.yml        # build: ./source
    ├── .env                           # API 키, 봇 비밀번호
    └── source/                        # Mac에서 rsync로 복사한 소스
        ├── Dockerfile
        ├── package.json
        ├── package-lock.json
        ├── tsconfig.json
        └── src/
```

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `Login failed for stock-bot` | 봇 계정 미생성 또는 비밀번호 오타 | Phase 1 다시 확인, .env 비밀번호 확인 |
| `Bot scheduler disabled` | `BOT_ENABLED=false` | .env에서 `true`로 변경 후 재시작 |
| 댓글 답변이 안 됨 | 백엔드에 `BOT_WEBHOOK_URL` 미설정 | `.env.production`에 추가 후 `docker restart kimitter-backend` |
| `ECONNREFUSED` | 봇↔백엔드 네트워크 분리됨 | 같은 `kimitter-net`에 있는지 확인 |
| NAS에서 빌드 실패 | `package-lock.json` 누락 | rsync/scp 시 포함되었는지 확인 |
| 주식봇이 글을 안 올림 | 월요일이 아님 | 주식봇은 매주 월요일만 동작 |
| `Cannot find module` | NAS 인터넷 끊김 (npm ci 실패) | NAS 인터넷 확인 후 `docker compose build --no-cache` |

---

## 체크리스트

### Phase 1: 준비
- [ ] OpenAI API Key 발급
- [ ] Naver Developers API Key 발급
- [ ] 한국투자증권 API Key 발급
- [ ] NAS에서 봇 계정 3개 생성 (초대코드 → 회원가입 → BOT role)
- [ ] 비밀번호 3개 안전하게 저장

### Phase 2: 로컬 테스트
- [ ] `bot/.env` 작성 (`KIMITTER_API_URL=https://kimitter.yeonnnn.xyz/api`)
- [ ] `npm run dev` 실행 → "Scheduler started with 3 jobs" 확인
- [ ] 수동 트리거로 게시글 올라오는지 확인

### Phase 3: NAS 배포
- [ ] `rsync`로 소스를 NAS에 복사
- [ ] NAS에서 `.env` 작성 (`KIMITTER_API_URL=http://kimitter-backend:3000/api`)
- [ ] NAS에서 `docker-compose.prod.yml` 작성 (`build: ./source`)
- [ ] 백엔드 `.env.production`에 `BOT_WEBHOOK_URL` 추가 → 재시작
- [ ] `docker compose up -d --build`
- [ ] `curl localhost:4000/health` → `{"status":"ok"}`
- [ ] 다음날 아침 8시 피드 확인
- [ ] 봇 글에 댓글 달아서 AI 답변 확인
