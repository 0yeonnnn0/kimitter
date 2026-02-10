# 050 - 검색 탭 월별 갤러리 + 텍스트 전용 타일

## 변경 사항

### `frontend/app/(tabs)/search.tsx`

**기본 화면 (검색 전) 전면 재구성:**

- 데이터 소스: `searchPosts({ mediaOnly })` → `getPosts(1, 100)` (전체 게시물)
- 월별 그룹핑: `buildGalleryRows()` 함수가 게시물을 월별로 그룹 → `GalleryRow[]` 생성
  - `{ type: 'header', label: '2026년 2월' }` — 월 헤더
  - `{ type: 'row', posts: Post[] }` — 3열 타일 행
- `numColumns` 제거 → 직접 row를 `flexDirection: 'row'` View로 렌더링 (월 헤더와 혼합 불가하므로)

**타일 종류:**

| 타일 유형 | 조건 | 표시 |
|-----------|------|------|
| 미디어 타일 | `post.media.length > 0` | 첫 번째 미디어 썸네일 (기존과 동일) |
| 텍스트 타일 | `post.media.length === 0` | 회색 배경 + 텍스트 미리보기 (5줄) + 작성자 이름 |

**동일한 기능 유지:**
- 다중 미디어 배지 (우상단 copy 아이콘)
- 동영상 배지 (좌하단 play 아이콘)
- 타일 탭 → 글 상세 이동
- pull-to-refresh
- 검색 결과 화면은 기존 PostCard 피드 그대로

## 새로 추가된 스타일
- `monthHeader` / `monthHeaderText` — 월별 섹션 헤더
- `textTile` — 텍스트 전용 타일 배경
- `textTileContent` — 본문 미리보기 (12px, 5줄 제한)
- `textTileAuthor` — 작성자 이름 (10px, 하단)
