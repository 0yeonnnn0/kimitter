# 038. 좋아요/댓글 시 알림(Notification) 생성

**날짜**: 2026-02-10
**요약**: 좋아요 및 댓글 작성 시 게시물/댓글 작성자에게 Notification 레코드 생성하여 활동 탭에 표시

---

## 문제

- 좋아요/댓글을 달아도 상대방의 활동 탭에 아무것도 표시되지 않음
- 원인: `likeService`와 `commentService`에서 Notification을 생성하지 않았음
- 프론트 활동 탭은 `notifications` 테이블만 조회하므로 항상 빈 화면

## 변경 사항

### `backend/src/services/likeService.ts`

- `togglePostLike`: 좋아요 시 게시물 작성자에게 `LIKE` 타입 Notification 생성
- `toggleCommentLike`: 좋아요 시 댓글 작성자에게 `LIKE` 타입 Notification 생성
- 자기 글/댓글에 자기가 좋아요 → 알림 미생성

### `backend/src/services/commentService.ts`

- `createComment`: 댓글 시 게시물 작성자에게 `COMMENT` 타입 Notification 생성
- `createComment` (대댓글): 부모 댓글 작성자에게 `REPLY` 타입 Notification 생성
- `createReply`: 답글 시 부모 댓글 작성자에게 `REPLY` 타입 Notification 생성
- 자기 글/댓글에 자기가 댓글 → 알림 미생성

### 공통

- 알림 생성 실패 시 try/catch로 감싸서 메인 로직(좋아요/댓글)에 영향 없음
- 실패 시 logger.error로 기록

## 검증

- ✅ Backend `tsc --noEmit` — 에러 0개
