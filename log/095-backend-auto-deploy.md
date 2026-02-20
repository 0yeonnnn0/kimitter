# 095 — 백엔드 자동 배포 파이프라인

**날짜**: 2026-02-21

## 구성

### GitHub Actions (`.github/workflows/deploy-backend.yml`)
- `backend/` 하위 파일 변경 시 자동 트리거
- `linux/amd64` Docker 이미지 빌드 → Docker Hub push
- GitHub Actions 캐시로 빌드 속도 최적화

### NAS 자동 pull (`backend/nas-sync.sh`)
- 5분마다 Docker Hub에서 새 이미지 확인
- 이미지 digest 비교로 변경 감지
- 새 이미지 감지 시 자동 재시작
- 로그: `/volume1/docker/kimitter/backend-sync.log`

## 전체 흐름
```
git push (backend/ 변경)
  → GitHub Actions: Docker build + push
  → NAS cron (5분): docker compose pull
  → 새 이미지 감지 → docker compose up -d backend
```

## 설정 필요 사항

### 1. GitHub Secrets 등록
Repository Settings → Secrets and variables → Actions:
- `DOCKER_USERNAME`: `dusehd1`
- `DOCKER_PASSWORD`: Docker Hub Access Token

### 2. NAS Task Scheduler 등록
제어판 → 작업 스케줄러 → 생성 → 예약된 작업 → 사용자 정의 스크립트:
- 일정: 5분마다
- 명령: `bash /volume1/docker/kimitter/nas-sync.sh`
- nas-sync.sh 파일을 NAS `/volume1/docker/kimitter/`에 복사 필요
