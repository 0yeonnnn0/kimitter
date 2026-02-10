# 041. 활동 탭 pull-to-refresh 추가

**날짜**: 2026-02-10
**요약**: 활동 화면에서 아래로 스크롤하여 새로고침 가능하도록 RefreshControl 추가

---

## 변경 사항

### `frontend/app/(tabs)/activity.tsx`

- FlatList에 `RefreshControl` 추가
- 스크롤 당겨서 새로고침 → `fetchUnread()` 재호출

## 검증

- ✅ Frontend `tsc --noEmit` — 에러 0개
