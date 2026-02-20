# 097 — Expo dev 서버 시작 시 자동 코드 업데이트 + 의존성 설치

**날짜**: 2026-02-21

## 문제
- NAS Expo dev 컨테이너가 Docker 빌드 시점의 코드로 시작
- 새 패키지(expo-video 등) 추가 후 컨테이너 재시작 시 node_modules에 없어서 에러
- sync.sh가 5분 뒤에야 동작하므로 시작 직후에는 구버전 코드 사용

## 수정

### entrypoint-nas.sh
- 시작 시 `git pull` → `npm install` 실행 후 Expo 시작
- 컨테이너 재시작만으로 최신 코드 + 의존성 반영

### sync.sh
- `npm ci` → `npm install`로 변경 (더 유연)
- expo 재시작 명령어를 entrypoint와 동일하게 수정 (--port 80 + REACT_NATIVE_PACKAGER_HOSTNAME)

## 파일
- `frontend/entrypoint-nas.sh`
- `frontend/sync.sh`
