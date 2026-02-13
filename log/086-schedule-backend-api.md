# 086 - 백엔드 스케쥴(캘린더) API 구현

**날짜**: 2026-02-13

## 변경 사항

### 새 파일 생성
- `backend/src/services/scheduleService.ts` — 스케쥴 CRUD 비즈니스 로직 (월별 조회, 날짜별 조회, 생성, 수정, 삭제)
- `backend/src/controllers/scheduleController.ts` — Express 라우트 핸들러 (Controller → Service 패턴)
- `backend/src/validations/scheduleValidation.ts` — Joi 유효성 검사 스키마 (create, update, monthQuery, dateQuery)
- `backend/src/routes/schedules.ts` — Express 라우트 정의 (GET/POST/PUT/DELETE)

### 수정된 파일
- `backend/prisma/schema.prisma` — Schedule 모델 추가 (id, userId, title, memo, startDate, endDate, color, timestamps)
- `backend/src/routes/index.ts` — scheduleRouter import 및 `/schedules` 경로 등록

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/schedules?year=&month=` | 월별 일정 조회 |
| GET | `/api/schedules/date?date=YYYY-MM-DD` | 특정 날짜 일정 조회 |
| POST | `/api/schedules` | 일정 생성 |
| PUT | `/api/schedules/:id` | 일정 수정 (본인만) |
| DELETE | `/api/schedules/:id` | 일정 삭제 (본인 또는 관리자) |

## 참고
- Prisma migration은 NAS 프로덕션 DB에서 실행 필요: `npx prisma migrate dev --name add-schedule`
- Docker 이미지 재빌드 후 NAS Container Manager에서 rebuild 필요
- 프론트엔드 캘린더 UI는 이전 커밋(acc9673)에서 완료됨
