# Kimitter 봇 서비스 — NAS 배포 절차

## 전제 조건

- NAS에 백엔드가 이미 `docker-compose.prod.yml`로 돌아가고 있음
- `kimitter-net` 네트워크에 `kimitter-backend`, `kimitter-db` 컨테이너가 연결되어 있음
- NAS 경로: `/volume1/docker/kimitter/`

---

## 전체 흐름 (Mac에서 하는 것 / NAS에서 하는 것)

```
[Mac]                              [NAS (Synology)]
  │                                   │
  ├─ 1. 봇 이미지 빌드 & push ──────▶ Docker Hub
  │                                   │
  │                                   ├─ 2. 봇 계정 생성 (DB)
  │                                   ├─ 3. .env 파일 작성
  │                                   ├─ 4. docker-compose.prod.yml 배치
  │                                   ├─ 5. 백엔드 .env에 웹훅 URL 추가
  │                                   └─ 6. 컨테이너 실행
```

---

## Step 1. Mac에서 — Docker 이미지 빌드 & Push

NAS는 **linux/amd64** (Intel Celeron N97)이므로 `--platform linux/amd64`로 빌드한다.

```bash
cd bot

# Docker Hub에 로그인 (이미 되어 있으면 스킵)
docker login

# amd64 이미지 빌드 + push
docker buildx build --platform linux/amd64 --no-cache \
  -t dusehd1/kimitter-bot:1.0.0 \
  -t dusehd1/kimitter-bot:latest \
  --push .
```

확인:
```bash
docker manifest inspect dusehd1/kimitter-bot:latest | grep architecture
# "architecture": "amd64" 이면 OK
```

---

## Step 2. NAS에서 — 봇 계정 생성

SSH로 NAS 접속:
```bash
ssh admin@NAS_IP
```

### 2-1. 초대코드 생성

```bash
# 관리자 토큰 받기
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"실제관리자비밀번호"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 초대코드 3개
CODE1=$(curl -s -X POST http://localhost:3000/api/admin/invitation-codes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"stock-bot@kimitter.local"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['code'])")

CODE2=$(curl -s -X POST http://localhost:3000/api/admin/invitation-codes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"politics-bot@kimitter.local"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['code'])")

CODE3=$(curl -s -X POST http://localhost:3000/api/admin/invitation-codes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"news-bot@kimitter.local"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['code'])")

echo "Stock: $CODE1"
echo "Politics: $CODE2"
echo "News: $CODE3"
```

### 2-2. 봇 회원가입

비밀번호를 생성하고 메모해둔다 (나중에 .env에 넣어야 함):

```bash
# 랜덤 비밀번호 생성
STOCK_PW=$(openssl rand -hex 32)
POLITICS_PW=$(openssl rand -hex 32)
NEWS_PW=$(openssl rand -hex 32)

echo "=== 비밀번호 (반드시 메모!) ==="
echo "stock-bot: $STOCK_PW"
echo "politics-bot: $POLITICS_PW"
echo "news-bot: $NEWS_PW"

# 회원가입
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"invitationCode\":\"$CODE1\",\"username\":\"stock-bot\",\"password\":\"$STOCK_PW\",\"nickname\":\"📊 주식봇\"}"

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"invitationCode\":\"$CODE2\",\"username\":\"politics-bot\",\"password\":\"$POLITICS_PW\",\"nickname\":\"🏛️ 정치봇\"}"

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"invitationCode\":\"$CODE3\",\"username\":\"news-bot\",\"password\":\"$NEWS_PW\",\"nickname\":\"📰 뉴스봇\"}"
```

### 2-3. BOT role 부여

```bash
docker exec -it kimitter-db psql -U family_user -d family_threads -c \
  "UPDATE \"User\" SET role = 'BOT' WHERE username IN ('stock-bot', 'politics-bot', 'news-bot');"

# 확인
docker exec -it kimitter-db psql -U family_user -d family_threads -c \
  "SELECT username, nickname, role FROM \"User\" WHERE role = 'BOT';"
```

출력:
```
  username    |  nickname  | role
--------------+------------+------
 stock-bot    | 📊 주식봇  | BOT
 politics-bot | 🏛️ 정치봇  | BOT
 news-bot     | 📰 뉴스봇  | BOT
```

---

## Step 3. NAS에서 — 봇 서비스 .env 작성

```bash
mkdir -p /volume1/docker/kimitter-bot
cd /volume1/docker/kimitter-bot
```

`.env` 파일 생성:
```bash
cat > .env << 'ENVEOF'
# Kimitter API — Docker 네트워크 내부 통신 (컨테이너 이름 사용)
KIMITTER_API_URL=http://kimitter-backend:3000/api

# 봇 계정 (Step 2에서 생성한 비밀번호 입력)
BOT_STOCK_USERNAME=stock-bot
BOT_STOCK_PASSWORD=여기에_STOCK_PW_값
BOT_POLITICS_USERNAME=politics-bot
BOT_POLITICS_PASSWORD=여기에_POLITICS_PW_값
BOT_NEWS_USERNAME=news-bot
BOT_NEWS_PASSWORD=여기에_NEWS_PW_값

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
```

**vi로 편집해서 실제 값을 넣는다:**
```bash
vi .env
```

---

## Step 4. NAS에서 — docker-compose.prod.yml 배치

```bash
cat > /volume1/docker/kimitter-bot/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  bot:
    image: dusehd1/kimitter-bot:latest
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

핵심 포인트:
- `image: dusehd1/kimitter-bot:latest` — Docker Hub에서 pull (`build:` 아님)
- `kimitter-net: external: true` — 기존 백엔드와 같은 네트워크
- `KIMITTER_API_URL=http://kimitter-backend:3000/api` — 컨테이너 이름으로 통신

---

## Step 5. NAS에서 — 백엔드에 웹훅 URL 추가

백엔드가 봇 게시글에 달린 댓글을 봇 서비스에 알려주려면 이 환경변수가 필요하다.

```bash
cd /volume1/docker/kimitter

# 기존 .env.production에 한 줄 추가
echo "BOT_WEBHOOK_URL=http://kimitter-bot:4000/webhook" >> .env.production

# 백엔드 재시작 (환경변수 반영)
docker-compose -f docker-compose.prod.yml restart backend
```

> `kimitter-bot`은 같은 `kimitter-net` 네트워크 안이므로 컨테이너 이름으로 접근 가능

---

## Step 6. NAS에서 — 봇 서비스 실행

```bash
cd /volume1/docker/kimitter-bot

# 이미지 pull + 실행
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker logs -f kimitter-bot
```

정상이면 로그에 이렇게 뜬다:
```
info: Starting Kimitter Bot Service...
info: Initializing bot clients...
info: All bot clients initialized and logged in
info: Bot service started on port 4000
info: Scheduler started with 3 jobs
```

### 헬스체크

```bash
# NAS 내부에서
curl http://localhost:4000/health
# {"status":"ok"}

# 또는 다른 컨테이너에서
docker exec kimitter-backend curl -s http://kimitter-bot:4000/health
# {"status":"ok"}
```

---

## 최종 확인

### NAS에서 돌아가는 컨테이너 목록

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

```
NAMES               STATUS          PORTS
kimitter-bot        Up 2 minutes    0.0.0.0:4000->4000/tcp
kimitter-backend    Up 3 days       0.0.0.0:3000->3000/tcp
kimitter-db         Up 3 days       5432/tcp
```

### 봇이 실제로 글을 올리는지 확인

- 정치봇/뉴스봇: 다음날 **아침 8:00~8:01 KST**에 글이 올라옴
- 주식봇: 다음 **월요일 오전 8:02 KST**에 글이 올라옴
- 앱을 열어서 피드에 봇 글이 뜨면 성공

### 댓글 Q&A 테스트

1. 앱에서 봇이 쓴 글에 댓글 달기 (예: "이거 더 자세히 알려줘")
2. 1~2분 기다리면 봇이 답글 작성
3. NAS 로그 확인: `docker logs kimitter-bot --tail 20`

---

## 업데이트 방법 (나중에 코드 수정했을 때)

```bash
# Mac에서
cd bot
docker buildx build --platform linux/amd64 --no-cache \
  -t dusehd1/kimitter-bot:latest --push .

# NAS에서
cd /volume1/docker/kimitter-bot
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
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
└── kimitter-bot/                      # 새로 추가
    ├── docker-compose.prod.yml        # bot 서비스
    └── .env                           # 봇 API 키, 비밀번호
```
