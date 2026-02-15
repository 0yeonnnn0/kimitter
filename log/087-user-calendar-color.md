# 087 - 유저별 캘린더 색상 시스템

**날짜**: 2026-02-15

## 변경 사항

### Backend
- `backend/prisma/schema.prisma` — User 모델에 `calendarColor` 필드 추가
- `backend/prisma/migrations/20260215000000_add_calendar_color/migration.sql` — migration 생성
- `backend/src/services/userService.ts` — userSelect에 calendarColor 추가, updateUser 타입에 추가
- `backend/src/controllers/userController.ts` — req.body.calendarColor 처리 추가
- `backend/src/services/scheduleService.ts` — scheduleInclude의 user select에 calendarColor 추가

### Frontend
- `frontend/src/types/models.ts` — User 인터페이스에 calendarColor 추가, Schedule의 user Pick에 calendarColor 추가
- `frontend/src/components/EditProfileModal.tsx` — 프로필 편집에 캘린더 색상 피커 추가 (8가지 프리셋 컬러)
- `frontend/app/(tabs)/schedule.tsx` — 캘린더 점 색상을 이벤트 색상 → 유저 calendarColor로 변경, 일정 생성/수정 모달에서 색상 피커 제거, 리스트 colorBar도 유저 색상 사용

## 동작 방식
- 각 유저는 프로필 편집에서 자신의 캘린더 색상을 선택 가능 (8가지 프리셋)
- 캘린더에서 특정 날짜에 일정이 있으면 해당 유저의 색상으로 점 표시
- 같은 날에 3명이 일정을 등록하면 점 3개가 각자 색상으로 표시 (최대 4개)
- 일정 리스트의 좌측 컬러바도 유저 색상 반영
