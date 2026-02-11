# 058. 백엔드 Docker 컨테이너화

## 변경 사항

### 신규 파일
- `backend/Dockerfile`: Multi-stage build (builder → production)
  - Builder: `npm ci` → `prisma generate` → `tsc` 빌드
  - Production: `npm ci --omit=dev` → `prisma generate` → `prisma migrate deploy` → `node dist/server.js`
  - Node 20 Alpine 기반, 포트 3000
- `backend/.dockerignore`: node_modules, dist, uploads, .env, .git 등 제외

### 수정 파일
- `backend/docker-compose.yml`:
  - `backend` 서비스 추가 (빌드 컨텍스트: `.`, 포트: `3000:3000`)
  - `env_file: .env` + `environment.DATABASE_URL` 오버라이드 (`localhost` → `postgres` 서비스명)
  - `uploads_data` 볼륨으로 업로드 파일 영속화
  - `depends_on: postgres` 로 시작 순서 보장
  - 컨테이너명 `family-threads-db` → `kimitter-db`로 변경

## 사용 방법

```bash
cd backend

# 전체 실행 (DB + 백엔드)
docker-compose up -d --build

# 로그 확인
docker-compose logs -f backend

# 중지
docker-compose down
```

## 주의사항
- `.env` 파일의 `DATABASE_URL`은 로컬 개발용 (`localhost`)으로 유지
- Docker 실행 시 `docker-compose.yml`의 `environment.DATABASE_URL`이 `.env` 값을 오버라이드하여 컨테이너 간 통신(`postgres`) 사용
- 업로드 파일은 `uploads_data` Docker 볼륨에 저장됨
