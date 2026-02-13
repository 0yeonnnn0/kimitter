# Docker Hub 배포 — Kimitter Backend

## TL;DR

> **Quick Summary**: 백엔드 Docker 이미지를 빌드하여 Docker Hub(`dusehd1/kimitter-backend`)에 push. Synology DS225+에서 pull할 수 있도록 프로덕션 compose 파일과 환경변수 템플릿도 생성.
> 
> **Deliverables**:
> - 미사용 `sharp` 의존성 제거
> - `dusehd1/kimitter-backend:1.0.0` + `:latest` 이미지 Docker Hub 배포
> - `backend/docker-compose.prod.yml` (Synology용 프로덕션 compose)
> - `backend/.env.production.example` (프로덕션 환경변수 템플릿)
> 
> **Estimated Effort**: Short (~30분)
> **Parallel Execution**: NO — sequential (빌드 → push → compose 생성)
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4

---

## Context

### Original Request
백엔드와 DB 이미지를 Docker Hub에 올려서 Synology NAS에서 다운받아 실행할 수 있게 해달라.

### Interview Summary
**Key Discussions**:
- 백엔드: HTTP REST API (Express.js, port 3000). gRPC/WebSocket 없음
- DB: PostgreSQL 15 (공식 이미지 사용, 별도 push 불필요)
- Docker Hub username: `dusehd1`
- Synology DS225+: Intel Celeron N97 (x86_64/amd64)
- `sharp` 라이브러리: 코드에서 미사용 확인 → 삭제 합의

**Research Findings**:
- Dockerfile: 이미 multi-stage build 구성 완료 (node:20-alpine)
- `.dockerignore`: `.env`, `node_modules`, `dist`, `uploads` 적절히 제외
- `prisma migrate deploy`: CMD에서 자동 실행 → 마이그레이션 자동 적용
- `sharp`: `package.json`에만 존재, `import`/`require` 0회 → 불필요

### Metis Review
**Identified Gaps** (addressed):
- `sharp` 크로스 빌드 문제 → 제거로 해결
- 기존 `docker-compose.yml` 수정 위험 → 별도 `docker-compose.prod.yml` 생성
- Synology 볼륨: named volume → bind mount로 변경 (NAS 파일 접근성)
- `NODE_ENV=production` 누락 가능성 → prod compose에 명시

---

## Work Objectives

### Core Objective
Kimitter 백엔드 Docker 이미지를 Docker Hub에 배포하고, Synology NAS에서 바로 사용할 수 있는 프로덕션 compose 파일을 생성한다.

### Concrete Deliverables
- `dusehd1/kimitter-backend:1.0.0` Docker Hub 이미지
- `dusehd1/kimitter-backend:latest` Docker Hub 이미지
- `backend/docker-compose.prod.yml` Synology용 compose 파일
- `backend/.env.production.example` 프로덕션 환경변수 템플릿

### Definition of Done
- [x] `docker pull dusehd1/kimitter-backend:1.0.0` 성공
- [x] `docker pull dusehd1/kimitter-backend:latest` 성공
- [x] `docker inspect`로 아키텍처 `amd64` 확인
- [x] `docker-compose.prod.yml`이 Docker Hub 이미지 참조 (`build:` 없음)
- [x] `.env.production.example`에 모든 필수 변수 포함

### Must Have
- `linux/amd64` 플랫폼 빌드
- 이미지 태그: `1.0.0` + `latest`
- Synology용 bind mount 볼륨 (uploads, postgres_data)
- `NODE_ENV=production` 설정

### Must NOT Have (Guardrails)
- 기존 `docker-compose.yml` 수정 금지 (로컬 개발용 유지)
- `.env` 실제 시크릿 파일 Docker Hub/이미지에 포함 금지
- Nginx 리버스 프록시 설정 (별도 작업)
- CI/CD 파이프라인 구성 (별도 작업)
- 프론트엔드 이미지 빌드/배포 (네이티브 앱, EAS Build 사용)
- health check / wait-for-db 스크립트 (현재 `restart: unless-stopped`로 충분)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Jest, but not relevant here)
- **Automated tests**: NO (인프라 배포 작업, 단위 테스트 대상 아님)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Docker build | Bash (docker) | Build command exit code, image list |
| Docker push | Bash (docker) | Push output, pull verification |
| Compose file | Bash (docker compose config) | Syntax validation |
| Config file | Bash (grep) | Required keys present |

---

## Execution Strategy

### Sequential Execution (No Parallelization)

```
Task 1: sharp 제거 + npm install
    ↓
Task 2: Docker 이미지 빌드 + 태그
    ↓
Task 3: Docker Hub 로그인 + push
    ↓
Task 4: Synology용 docker-compose.prod.yml + .env.production.example 생성
    ↓
Task 5: tsc 검증 + 로그 + 커밋
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 2 |
| 2 | 1 | 3 |
| 3 | 2 | None |
| 4 | None | 5 |
| 5 | 1, 3, 4 | None |

> Task 4는 Task 1~3과 독립적이지만, 최종 커밋을 위해 순서대로 진행.

---

## TODOs

- [x] 0. 프로필 편집 모달 풀스크린 전환 ✅ (커밋 c105435 완료)

  **What to do**:
  - `frontend/src/components/EditProfileModal.tsx`에서 `<BottomSheet visible={visible} onClose={onClose}>` → `<BottomSheet visible={visible} onClose={onClose} fullScreen>` 변경
  - InviteModal과 동일한 패턴 (키보드에 입력 칸 가려지지 않도록)

  **Must NOT do**:
  - BottomSheet 컴포넌트 자체 수정하지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Docker 작업과 독립)
  - **Blocks**: Task 5 (커밋)
  - **Blocked By**: None

  **References**:
  - `frontend/src/components/EditProfileModal.tsx:100` — `<BottomSheet visible={visible} onClose={onClose}>` (수정 대상)
  - `frontend/src/components/InviteModal.tsx:68` — `<BottomSheet visible={visible} onClose={handleClose} fullScreen>` (동일 패턴 참고)
  - `frontend/src/components/BottomSheet.tsx:20` — `fullScreen?: boolean` prop 정의

  **Acceptance Criteria**:

  ```
  Scenario: 프로필 편집 모달 풀스크린 확인
    Tool: Bash (grep)
    Steps:
      1. grep -q "fullScreen" frontend/src/components/EditProfileModal.tsx
      2. Assert: exit code 0
      3. cd frontend && npx tsc --noEmit
      4. Assert: exit code 0
    Expected Result: fullScreen prop 추가됨, 타입 체크 통과
  ```

  **Commit**: NO (Task 5에서 일괄 커밋)

---

- [x] 1. 미사용 `sharp` 의존성 제거

  **What to do**:
  - `backend/package.json`에서 `"sharp": "^0.33.2"` 제거
  - `cd backend && npm install` 실행하여 `package-lock.json` 갱신
  - `npx tsc --noEmit`으로 타입 검증 (sharp 미사용이므로 깨지지 않아야 함)

  **Must NOT do**:
  - 다른 의존성 건드리지 않기
  - `sharp` import가 있는 파일 수정 (없음, 확인 완료)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - 단순 의존성 제거, 스킬 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - `backend/package.json:28` — `"sharp": "^0.33.2"` 라인 (제거 대상)
  - `backend/package-lock.json` — npm install 시 자동 갱신

  **Acceptance Criteria**:

  ```
  Scenario: sharp 제거 후 빌드 검증
    Tool: Bash
    Steps:
      1. grep -q "sharp" backend/package.json
      2. Assert: exit code 1 (not found)
      3. cd backend && npx tsc --noEmit
      4. Assert: exit code 0
    Expected Result: sharp가 package.json에 없고 타입 체크 통과
  ```

  **Commit**: NO (Task 5에서 일괄 커밋)

---

- [x] 2. Docker 이미지 빌드 (linux/amd64)

  **What to do**:
  - `docker buildx` 사용 가능 여부 확인: `docker buildx version`
  - Apple Silicon → amd64 크로스 빌드:
    ```bash
    docker buildx build \
      --platform linux/amd64 \
      -t dusehd1/kimitter-backend:1.0.0 \
      -t dusehd1/kimitter-backend:latest \
      --load \
      ./backend
    ```
  - 빌드 성공 확인 + 아키텍처 검증

  **Must NOT do**:
  - `--push` 플래그 사용하지 않기 (빌드와 push 분리)
  - Dockerfile 수정하지 않기 (이미 잘 구성됨)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `backend/Dockerfile` — multi-stage build 정의
  - `backend/.dockerignore` — 빌드 제외 파일 (`.env`, `node_modules`, `dist`, `uploads`)

  **Acceptance Criteria**:

  ```
  Scenario: 이미지 빌드 성공 및 아키텍처 확인
    Tool: Bash
    Steps:
      1. docker buildx build --platform linux/amd64 \
           -t dusehd1/kimitter-backend:1.0.0 \
           -t dusehd1/kimitter-backend:latest \
           --load ./backend
      2. Assert: exit code 0
      3. docker images dusehd1/kimitter-backend --format '{{.Tag}}'
      4. Assert: output contains "1.0.0" and "latest"
      5. docker inspect dusehd1/kimitter-backend:1.0.0 --format '{{.Architecture}}'
      6. Assert: output is "amd64"
    Expected Result: 두 태그 모두 존재, 아키텍처 amd64
  ```

  **Commit**: NO (Task 5에서 일괄 커밋)

---

- [x] 3. Docker Hub 로그인 + push

  **What to do**:
  - Docker Hub 로그인 상태 확인: `docker info 2>&1 | grep Username`
  - 로그인 안 되어 있으면: `docker login -u dusehd1` (패스워드/토큰 입력 필요)
  - 이미지 push:
    ```bash
    docker push dusehd1/kimitter-backend:1.0.0
    docker push dusehd1/kimitter-backend:latest
    ```
  - Push 성공 확인: `docker pull dusehd1/kimitter-backend:1.0.0`로 라운드트립 검증

  **Must NOT do**:
  - Docker Hub 패스워드를 코드나 파일에 저장하지 않기
  - private repo 설정 변경하지 않기 (기본 public)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None (Task 4는 독립)
  - **Blocked By**: Task 2

  **References**:
  - Docker Hub: `hub.docker.com/r/dusehd1/kimitter-backend` (push 후 생성됨)

  **Acceptance Criteria**:

  ```
  Scenario: Docker Hub push 및 pull 검증
    Tool: Bash
    Steps:
      1. docker push dusehd1/kimitter-backend:1.0.0
      2. Assert: exit code 0, output contains "Pushed"
      3. docker push dusehd1/kimitter-backend:latest
      4. Assert: exit code 0
      5. docker rmi dusehd1/kimitter-backend:1.0.0 (로컬 삭제)
      6. docker pull dusehd1/kimitter-backend:1.0.0
      7. Assert: exit code 0 (Hub에서 정상 pull됨)
    Expected Result: 이미지가 Docker Hub에 존재하고 pull 가능
  ```

  **Commit**: NO (Task 5에서 일괄 커밋)

---

- [x] 4. Synology용 docker-compose.prod.yml + .env.production.example 생성

  **What to do**:
  - `backend/docker-compose.prod.yml` 생성:
    - `image: dusehd1/kimitter-backend:latest` (build 대신 image 참조)
    - `image: postgres:15` (공식 이미지 직접 pull)
    - bind mount 사용: uploads → `/volume1/docker/kimitter/uploads`, postgres → `/volume1/docker/kimitter/postgres`
    - `NODE_ENV=production` 환경변수 추가
    - `restart: unless-stopped` 유지
  - `backend/.env.production.example` 생성:
    - 모든 필수 환경변수 나열
    - 시크릿 값은 플레이스홀더로 (`your-jwt-secret-here`)
    - `NODE_ENV=production` 기본값
    - `UPLOAD_DIR=./uploads`
    - 주석으로 각 변수 설명

  **Must NOT do**:
  - 기존 `docker-compose.yml` 수정하지 않기
  - 실제 시크릿 값 포함하지 않기
  - Nginx 설정 포함하지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 1~3과 독립)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:
  - `backend/docker-compose.yml` — 기존 개발용 compose (구조 참고)
  - `backend/.env` — 필수 환경변수 목록 참고 (실제 값은 사용하지 않음)

  **docker-compose.prod.yml 내용**:
  ```yaml
  version: '3.8'

  services:
    postgres:
      image: postgres:15
      container_name: kimitter-db
      environment:
        POSTGRES_USER: family_user
        POSTGRES_PASSWORD: family_secret_pw
        POSTGRES_DB: family_threads
      ports:
        - '5432:5432'
      volumes:
        - /volume1/docker/kimitter/postgres:/var/lib/postgresql/data
      restart: unless-stopped

    backend:
      image: dusehd1/kimitter-backend:latest
      container_name: kimitter-backend
      ports:
        - '3000:3000'
      env_file:
        - .env.production
      environment:
        NODE_ENV: production
        DATABASE_URL: postgresql://family_user:family_secret_pw@postgres:5432/family_threads
      volumes:
        - /volume1/docker/kimitter/uploads:/app/uploads
      depends_on:
        - postgres
      restart: unless-stopped
  ```

  **Acceptance Criteria**:

  ```
  Scenario: prod compose 파일 문법 검증
    Tool: Bash
    Steps:
      1. docker compose -f backend/docker-compose.prod.yml config --quiet
      2. Assert: exit code 0
      3. grep -q "dusehd1/kimitter-backend" backend/docker-compose.prod.yml
      4. Assert: exit code 0 (Docker Hub 이미지 참조 확인)
      5. grep -q "build:" backend/docker-compose.prod.yml
      6. Assert: exit code 1 (로컬 빌드 참조 없음)
    Expected Result: 유효한 compose 파일, Hub 이미지 참조

  Scenario: env 템플릿 필수 변수 포함 확인
    Tool: Bash
    Steps:
      1. grep -q "JWT_SECRET" backend/.env.production.example
      2. Assert: exit code 0
      3. grep -q "JWT_REFRESH_SECRET" backend/.env.production.example
      4. Assert: exit code 0
      5. grep -q "NODE_ENV=production" backend/.env.production.example
      6. Assert: exit code 0
    Expected Result: 모든 필수 환경변수 포함
  ```

  **Commit**: NO (Task 5에서 일괄 커밋)

---

- [x] 5. 검증 + 로그 + 커밋

  **What to do**:
  - `cd backend && npx tsc --noEmit` — 타입 검증
  - `log/077-docker-hub-deploy.md` 로그 파일 생성
  - git add + commit 일괄:
    - `backend/package.json` (sharp 제거)
    - `backend/package-lock.json` (갱신)
    - `backend/docker-compose.prod.yml` (신규)
    - `backend/.env.production.example` (신규)
    - `log/077-docker-hub-deploy.md` (신규)
  - 커밋 메시지: `chore: remove unused sharp dependency and add Synology production deployment config`

  **Must NOT do**:
  - `.env` 파일 커밋하지 않기
  - `.env.production` 실제 파일 커밋하지 않기 (`.example`만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (최종 단계)
  - **Blocks**: None
  - **Blocked By**: Task 1, 3, 4

  **References**:
  - `backend/.gitignore` — `.env`가 제외되어 있는지 확인
  - AGENTS.md — "모든 질문에 대한 답변은 하나의 커밋으로 저장한다", "/log 폴더" 규칙

  **Acceptance Criteria**:

  ```
  Scenario: 커밋 성공 검증
    Tool: Bash
    Steps:
      1. cd backend && npx tsc --noEmit
      2. Assert: exit code 0
      3. git status
      4. Assert: working tree clean (커밋 완료)
      5. git log -1 --oneline
      6. Assert: 최신 커밋 메시지에 "sharp" 또는 "deploy" 포함
    Expected Result: 타입 체크 통과, 커밋 완료
  ```

  **Commit**: YES
  - Message: `chore: remove unused sharp dependency and add Synology production deployment config`
  - Files: `backend/package.json`, `backend/package-lock.json`, `backend/docker-compose.prod.yml`, `backend/.env.production.example`, `log/077-docker-hub-deploy.md`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 5 (일괄) | `chore: remove unused sharp dependency and add Synology production deployment config` | package.json, package-lock.json, docker-compose.prod.yml, .env.production.example, log/077-*.md | `npx tsc --noEmit` |

---

## Success Criteria

### Verification Commands
```bash
# sharp 제거 확인
grep "sharp" backend/package.json   # Expected: no output

# 이미지 Docker Hub 존재
docker pull dusehd1/kimitter-backend:1.0.0   # Expected: success
docker pull dusehd1/kimitter-backend:latest   # Expected: success

# 아키텍처 확인
docker inspect dusehd1/kimitter-backend:1.0.0 --format '{{.Architecture}}'   # Expected: amd64

# prod compose 유효성
docker compose -f backend/docker-compose.prod.yml config --quiet   # Expected: exit 0

# 타입 체크
cd backend && npx tsc --noEmit   # Expected: no errors
```

### Final Checklist
- [x] `sharp` dependency가 `package.json`에서 제거됨
- [x] `dusehd1/kimitter-backend:1.0.0` Docker Hub에서 pull 가능
- [x] `dusehd1/kimitter-backend:latest` Docker Hub에서 pull 가능
- [x] 이미지 아키텍처가 `amd64`
- [x] `docker-compose.prod.yml`이 Hub 이미지 참조 (build 없음)
- [x] `.env.production.example`에 모든 필수 변수 포함
- [x] 기존 `docker-compose.yml` 변경 없음
- [x] `.env` 실제 시크릿이 커밋/이미지에 포함되지 않음
- [x] `npx tsc --noEmit` 통과
- [x] 로그 파일 생성 + git 커밋 완료
