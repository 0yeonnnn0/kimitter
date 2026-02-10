# 검색 화면 리뉴얼 — 태그 검색 + 유저 검색 기능 추가

**날짜**: 2026-02-10
**요청**: 검색 바 아래 태그/유저 필터 버튼, 배지 기반 검색 모드 전환, 태그별 게시물 조회, 유저 이름/아이디 검색

---

## 변경 사항

### 백엔드

#### 1. 유저 검색 엔드포인트 추가
- **파일**: `backend/src/services/userService.ts`
- `searchUsers(query)`: username 또는 nickname에 대해 case-insensitive contains 검색 (최대 20개)
- **파일**: `backend/src/controllers/userController.ts`
- `searchUsers` 컨트롤러 추가
- **파일**: `backend/src/routes/users.ts`
- `GET /users/search?q=` — `/:userId` 보다 먼저 등록 (라우트 우선순위)

### 프론트엔드

#### 2. tagService.ts (신규)
- `searchTags(q)` → `GET /tags/search?q=`
- `getPostsByTag(tagName)` → `GET /tags/:tagName/posts`

#### 3. userService.ts — searchUsers 추가
- `searchUsers(q)` → `GET /users/search?q=`

#### 4. search.tsx — 전면 리뉴얼
**검색 모드 (SearchMode):**
- `all`: 기존 게시물 내용 검색 (기본)
- `tag`: 태그 검색 → 태그 목록 → 태그 선택 시 해당 태그 게시물 표시
- `user`: 유저 이름/아이디 검색 → 유저 카드 리스트 → 탭하면 프로필로 이동

**UI 구성:**
- 검색 바 내부에 모드별 파란색 배지 표시 ("태그" / "유저")
- 배지 X 버튼으로 모드 해제
- 검색 바 아래 필터 버튼 (태그 / 유저) — 토글 방식
- 태그 모드: 검색 → 태그 리스트 → 태그 클릭 → 해당 태그 게시물 (breadcrumb으로 돌아가기)
- 유저 모드: 검색 → 유저 카드 (아바타 + 닉네임 + @username) → 탭하면 프로필로 이동
- 전체 모드: 기존과 동일 (게시물 내용 검색)

---

## 검증

- [x] `npx tsc --noEmit` (backend) — 에러 0개
- [x] `npx tsc --noEmit` (frontend) — 에러 0개
