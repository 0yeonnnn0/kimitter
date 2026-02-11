# 067 - 글 삭제 후 피드 새로고침

## 요청

글이 삭제되고 나면 피드를 다시 로딩하여 불러오도록.

## 변경 사항

### `frontend/src/components/PostActionSheet.tsx`

- 삭제 성공 후 `fetchPosts(true)`를 호출하여 서버에서 피드를 새로 불러옴
- 기존 `removePost(postId)`로 즉시 로컬 제거 (낙관적) + `fetchPosts(true)`로 서버 동기화

## 검증

- `npx tsc --noEmit`: 에러 0개
