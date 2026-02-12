# NAS Docker Deployment Fix

**Date**: 2026-02-12
**Session**: 079

---

## Summary
Prisma binary compatibility 및 Docker 네트워크 설정을 수정하여 Synology NAS 환경에서의 안정적인 배포를 지원합니다. DB 백업 스크립트 추가.

## Changed Files

### 1. backend/Dockerfile
- **Change**: `node:20-alpine` → `node:20-slim` 변경 + OpenSSL 설치
- **Reason**: Prisma 엔진이 Alpine의 musl libc에서 OpenSSL 감지 실패

### 2. backend/prisma/schema.prisma
- **Change**: binaryTargets에 `debian-openssl-3.0.x` 추가
- **Reason**: Debian slim 기반 이미지에서 Prisma 엔진 바이너리 명시적 지정

### 3. backend/docker-compose.prod.yml
- **Change**: Docker 네트워크(`kimitter-net`) 명시적 추가
- **Reason**: Synology Container Manager에서 컨테이너 간 DNS 통신 불가 문제 해결

### 4. backend/scripts/backup-db.sh (신규)
- **Change**: PostgreSQL DB 백업 스크립트 추가
- **Reason**: NAS Task Scheduler에서 매일 자동 백업 실행용
