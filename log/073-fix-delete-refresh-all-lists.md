# 073 - 글 삭제 직후 모든 목록 새로고침 + 홈 RefreshControl 멈춤 수정

## 요청
1. 글 삭제 후 홈 피드 + 프로필 탭 목록 모두에서 즉시 반영
2. 프로필에서 삭제 후 홈 탭으로 전환 시 새로고침 스피너가 멈춰있는 버그 수정

## 원인
- `PostActionSheet`에서 `fetchPosts(true)` 호출 → `isRefreshing: true` 설정
- 프로필 화면에서 삭제 시 홈 FlatList의 `RefreshControl`이 `isRefreshing`을 구독하고 있어 스피너가 보이는 상태로 탭 전환됨
- `ProfileTabs`는 자체 로컬 state로 게시물을 관리하므로 feedStore 변경이 반영 안 됨

## 수정 내용

### `frontend/src/stores/feedStore.ts`
- `lastDeletedPostId: number | null` 상태 추가
- `removePost()` 시 `lastDeletedPostId`도 함께 설정

### `frontend/src/components/PostActionSheet.tsx`
- `fetchPosts(true)` → `fetchPosts()` 변경 (refresh=false, 스피너 없이 조용히 동기화)
- `removePost()`로 즉시 로컬 제거 + 백그라운드에서 서버 동기화

### `frontend/src/components/ProfileTabs.tsx`
- `useFeedStore`에서 `lastDeletedPostId` 구독
- `lastDeletedPostId` 변경 시 로컬 `posts` state에서 해당 게시물 필터링 제거

## 동작 흐름
1. 삭제 → `removePost(postId)` → feedStore에서 즉시 제거 + `lastDeletedPostId` 설정
2. `fetchPosts()` → 스피너 없이 서버에서 최신 피드 동기화
3. `ProfileTabs`가 `lastDeletedPostId` 구독 → 자체 목록에서도 즉시 제거

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
