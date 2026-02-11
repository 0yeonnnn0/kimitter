# 072 - 글 작성 후 홈 피드 새로고침

## 요청
글 작성 후 홈 화면에 돌아올 때 피드가 새로고침되도록.

## 원인
기존에는 `addPost(data.data)`로 로컬 상태에만 추가하고 서버에서 다시 불러오지 않았음.

## 수정 내용

### `frontend/src/components/CreatePostModal.tsx`
- `addPost` 대신 `fetchPosts`를 feedStore에서 가져옴
- 글 작성 성공 후 `fetchPosts(true)` 호출로 서버에서 최신 피드 전체를 새로 불러옴
- 로컬에 수동으로 추가하는 `addPost(data.data)` 제거

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
