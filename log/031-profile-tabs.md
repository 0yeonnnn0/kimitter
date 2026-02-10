# 프로필 페이지 탭 (스레드/답글/미디어) 구현

**날짜**: 2026-02-10
**요청**: 프로필 페이지에 탭을 만들어서 스레드 | 답글 | 미디어 3개로 나눠줘. 답글은 유저가 댓글을 단 게시물, 미디어는 미디어가 포함된 게시물.

---

## 변경 사항

### 백엔드

#### 1. userService.ts — 새 서비스 함수
- `getUserRepliedPosts(userId, page, limit, requesterId)`: 유저가 댓글을 작성한 게시물 목록 반환 (distinct postId로 중복 제거)
- `getUserMediaPosts(userId, page, limit, requesterId)`: 미디어가 1개 이상 포함된 유저의 게시물 반환 (`media: { some: {} }`)
- `getLikedPostIds()`: 공통 헬퍼로 추출 (getUserPosts에서도 사용하도록 리팩토링)
- 기존 `getUserComments`, `getUserMedia` 제거 (게시물 단위가 아니라 댓글/미디어 단위여서 요구사항과 불일치)

#### 2. userController.ts — 컨트롤러 변경
- `getUserComments` → `getUserRepliedPosts` (Post[] 반환, isLiked 포함)
- `getUserMedia` → `getUserMediaPosts` (Post[] 반환, isLiked 포함)

#### 3. routes/users.ts — 라우트 변경
- `GET /:userId/comments` → `GET /:userId/replies`
- `GET /:userId/media` → `GET /:userId/media-posts`

### 프론트엔드

#### 4. userService.ts — API 함수 추가
- `getUserRepliedPosts(userId, page, limit)` → `GET /users/:userId/replies`
- `getUserMediaPosts(userId, page, limit)` → `GET /users/:userId/media-posts`

#### 5. ProfileTabs.tsx (신규) — 공용 탭 컴포넌트
- Props: `{ userId: number, headerComponent: ReactElement }`
- 3개 탭: 스레드 / 답글 / 미디어
- 탭 전환 시 해당 API 호출하여 데이터 로드
- 각 탭별 빈 상태 메시지
- 좋아요 토글 (낙관적 업데이트 + 롤백) 내장
- Threads 스타일 탭 인디케이터 (하단 검정 바)

#### 6. profile.tsx — 내 프로필 페이지 간소화
- FlatList + handleLikeToggle + loadPosts 로직 제거
- ProfileTabs 컴포넌트로 대체
- 프로필 헤더 (이름, 아이디, 소개, 프로필 편집 버튼)만 유지

#### 7. user/[userId].tsx — 타 유저 프로필 페이지 간소화
- FlatList + handleLikeToggle + posts state 제거
- ProfileTabs 컴포넌트로 대체
- 프로필 헤더 + 뒤로가기 버튼만 유지

---

## 검증

- [x] `npx tsc --noEmit` (backend) — 에러 0개
- [x] `npx tsc --noEmit` (frontend) — 에러 0개
