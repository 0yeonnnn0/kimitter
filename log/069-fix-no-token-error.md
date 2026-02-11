# 069 - 앱 시작 시 "No token provided" 에러 수정

## 요청
앱 실행 시 백엔드에 `[error]: No token provided` 에러가 출력되는 문제 수정.

## 원인
1. `HomeScreen`의 `useEffect(() => { fetchPosts(); }, [])` — `isLoggedIn` 여부와 무관하게 마운트 즉시 API 호출
2. `restoreSession()`이 비동기이므로 토큰 복원 전에 API 호출이 먼저 실행됨
3. `errorHandler`가 401도 `logger.error()`로 출력하여 실제 에러처럼 보임

## 수정 내용

### `frontend/app/(tabs)/index.tsx`
- `isLoggedIn` 상태 구독 추가
- `fetchPosts()`를 `isLoggedIn`이 `true`일 때만 호출하도록 가드 추가
- 의존성 배열을 `[]` → `[isLoggedIn]`으로 변경 (로그인 후 자동 로딩)

### `backend/src/middleware/errorHandler.ts`
- 401 에러는 `logger.warn()`으로 로깅 (정상적인 미인증 요청이므로)
- 그 외 AppError는 기존과 동일하게 `logger.error()` 유지
- 비-AppError도 기존대로 `logger.error()` 유지

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
- `npx tsc --noEmit` 백엔드 — 에러 0개
