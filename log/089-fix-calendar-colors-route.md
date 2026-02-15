# 089 - 캘린더 색상 라우트 에러 수정

**날짜**: 2026-02-15

## 원인
- `GET /users/calendar-colors` 요청이 배포되지 않은 상태에서 `GET /users/:userId`에 매칭
- `"calendar-colors"` 문자열이 `Number()`로 파싱되어 `NaN` → Prisma `findUnique({ where: { id: NaN } })` 에러

## 수정 사항

### `backend/src/controllers/userController.ts`
- `getUser` 핸들러에 `isNaN(userId)` 방어 코드 추가 — 숫자가 아닌 userId는 404 NotFoundError 반환
- `NotFoundError` import 추가

## 배포 필요
- Docker 재빌드 + push 필요 (calendar-colors 라우트 등록 + 방어 코드 포함)
