# 047 - 검색 탭 미디어 갤러리 그리드 + 검색 결과 PostCard 피드

## 변경 사항

### 백엔드

#### `backend/src/services/postService.ts`
- `searchPosts` 함수에 `mediaOnly?: boolean` 파라미터 추가
- `mediaOnly=true` → `where.media = { some: {} }` 조건으로 미디어가 1개 이상 있는 게시물만 필터

#### `backend/src/controllers/postController.ts`
- `req.query.mediaOnly === 'true'` 파싱하여 서비스로 전달

### 프론트엔드

#### `frontend/src/services/postService.ts`
- `searchPosts` params에 `mediaOnly?: string` 추가

#### `frontend/app/(tabs)/search.tsx` (전면 재구성)

**기본 화면 (검색 전):**
- 앱 진입 시 `mediaOnly=true`로 미디어 포함 게시물 60개 로드
- 3열 정사각형 그리드로 각 게시물의 첫 번째 미디어 썸네일 표시
- 다중 미디어 게시물: 우상단 `copy-outline` 아이콘 배지
- 동영상 게시물: 좌하단 `play` 아이콘 배지
- 썸네일 탭 → 글 상세 페이지로 이동

**검색 결과 화면 (검색 후):**
- 게시물 검색: 홈과 동일한 PostCard 피드 (좋아요 토글 포함)
- 태그 검색: 태그 목록 → 태그 선택 시 PostCard 피드
- 유저 검색: 유저 목록 → 프로필 이동

**추가 기능:**
- 검색 상태일 때 입력란 우측에 X 버튼 (clearSearch)
- 갤러리/검색 결과 모두 pull-to-refresh 지원
- 검색바 + 필터를 FlatList의 ListHeaderComponent로 이동 (스크롤과 함께 올라감)

## 그리드 레이아웃
- 타일 크기: `(화면 너비 - 간격 4px) / 3` = 정사각형
- 간격: 2px (행 간, 열 간)
- Instagram 검색 탭과 유사한 레이아웃
