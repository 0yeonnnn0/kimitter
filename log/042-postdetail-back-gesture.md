# 042. 글 상세 페이지 뒤로가기 개선

**날짜**: 2026-02-10
**요약**: 뒤로가기 버튼을 아이콘으로 변경, iOS 스와이프 백 제스처 활성화

---

## 변경 사항

### `frontend/app/_layout.tsx`

- `Slot` → `Stack`으로 변경
- 모든 화면에 `gestureEnabled: true` 적용 (iOS 왼쪽 엣지 스와이프 뒤로가기)
- `[postId]` 화면에 `animation: 'slide_from_right'` 적용

### `frontend/app/[postId]/index.tsx`

- `← 뒤로` 텍스트 → `chevron-back` Ionicons 아이콘으로 변경
- 헤더 레이아웃: 뒤로 | 게시물 | (spacer) 중앙 정렬

## 검증

- ✅ Frontend `tsc --noEmit` — 에러 0개
