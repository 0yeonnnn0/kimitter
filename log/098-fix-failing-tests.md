# 098 - 기존 테스트 실패 2건 수정

## 변경 사항

### 1. authService — BOT 로그인 차단 로직 추가

**파일**: `backend/src/services/authService.ts`

**문제**: 테스트에서 BOT 역할 사용자의 로그인 시 403 ForbiddenError를 기대하지만, 실제 코드에는 BOT 체크 로직이 없어서 비밀번호 비교 단계로 넘어가 401 UnauthorizedError가 발생

**수정**: `login()` 함수에 `user.role === 'BOT'` 체크를 비밀번호 비교 전에 추가하여 ForbiddenError('Bot accounts cannot login') 발생

### 2. postService.test.ts — 함수 시그니처 불일치 수정

**파일**: `backend/src/services/postService.test.ts`

**문제**: `getPostById`와 `getPosts` 함수에 `userId` 파라미터가 추가(isLiked 기능)되었는데, 테스트가 이전 시그니처(userId 없음)로 호출 중이어서 TypeScript 컴파일 에러 발생

**수정**:
- `getPostById(999)` → `getPostById(999, 1)` (userId 추가)
- `getPostById(1)` → `getPostById(1, 1)` (userId 추가)
- `getPosts(1, 10)` → `getPosts(1, 10, 1)` (userId 추가)
- `like.findMany` mock을 빈 배열로 설정하여 `addIsLiked` 함수 정상 동작
- 기대값에 `isLiked: false` 추가

## 테스트 결과

- **수정 전**: 11 suites, 2 failed, 55 tests (1 failed)
- **수정 후**: 11 suites, 11 passed, 64 tests, 전부 통과
- `npx tsc --noEmit`: clean
