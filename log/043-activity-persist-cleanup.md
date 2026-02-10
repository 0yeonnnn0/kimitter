# 043. 활동 알림 읽어도 유지 + 30일 자동 삭제

**날짜**: 2026-02-10
**요약**: 활동 탭에서 읽은 알림도 계속 표시, 30일 지난 알림은 자동 삭제

---

## 변경 사항

### 프론트엔드

1. **notificationStore.ts**
   - `fetchUnread()` → `fetchNotifications()` 으로 변경
   - 전체 알림 조회 (`getNotifications`) + 미읽음 수 별도 조회 (`getUnreadNotifications`)
   - `markRead`: 리스트에서 제거하지 않고 `isRead: true`로 상태만 변경
   - `markAllRead`: 리스트 유지, 모두 `isRead: true`로 변경

2. **activity.tsx**
   - `fetchUnread` → `fetchNotifications` 호출로 변경
   - 이미 읽은 알림은 `markRead` 호출 안 함 (불필요한 API 방지)

### 백엔드

3. **notificationService.ts**
   - `cleanupOldNotifications()`: 30일 지난 알림 일괄 삭제
   - `startCleanupSchedule()`: 서버 시작 시 즉시 1회 + 24시간마다 반복

4. **server.ts**
   - 서버 시작 시 `startCleanupSchedule()` 호출

## 검증

- ✅ Backend `tsc --noEmit` — 에러 0개
- ✅ Frontend `tsc --noEmit` — 에러 0개
