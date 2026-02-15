# 088 - 캘린더 색상 중복 방지

**날짜**: 2026-02-15

## 변경 사항

### 백엔드

1. **`backend/src/routes/users.ts`**
   - `GET /users/calendar-colors` 라우트 등록 (`/:userId`보다 위에 배치하여 파라미터 충돌 방지)

2. **`backend/src/services/userService.ts`**
   - `getCalendarColors()` 함수 추가: 활성 유저 중 calendarColor가 설정된 유저 목록 반환
   - `updateUser()`에 calendarColor 중복 체크 로직 추가: 다른 유저가 이미 사용 중인 색상이면 409 에러

3. **`backend/src/controllers/userController.ts`**
   - `getCalendarColors` 핸들러 추가

### 프론트엔드

4. **`frontend/src/services/userService.ts`**
   - `getCalendarColors()` API 호출 함수 추가 (`GET /users/calendar-colors`)

5. **`frontend/src/components/EditProfileModal.tsx`**
   - 모달 열릴 때 `getCalendarColors` API 호출하여 사용 중인 색상 조회
   - 다른 유저가 사용 중인 색상은 opacity 0.3 + X 아이콘으로 비활성화 표시
   - 비활성화된 색상은 터치 불가 (`disabled` prop)

## 목적
- 가족 4명이 각자 고유한 캘린더 색상을 갖도록 중복 선택 방지
- 백엔드에서 409 에러로 이중 안전장치 + 프론트엔드에서 시각적으로 사용 불가 표시
