# 070 - 게시물 상세 pull-to-refresh + 활동 페이지 빈 영역 새로고침

## 요청
1. 게시물 상세 페이지에서 위로 스크롤하면 새로고침 가능하도록
2. 활동 페이지에서 내역이 적을 때 빈 배경에서도 pull-to-refresh 가능하도록

## 수정 내용

### `frontend/app/[postId]/index.tsx`
- `RefreshControl` import 추가
- `refreshing` 상태 추가
- `handleRefresh` 콜백 추가 (게시물 + 댓글 동시 리로드)
- `FlatList`에 `refreshControl` prop 연결

### `frontend/app/(tabs)/activity.tsx`
- `FlatList`에 `contentContainerStyle={{ flexGrow: 1 }}` 추가
- 콘텐츠가 화면을 다 채우지 않아도 FlatList가 전체 영역을 차지하여 빈 배경에서도 pull-to-refresh 동작

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
