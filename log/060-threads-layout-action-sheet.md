# 060. Threads 스타일 2-column 레이아웃 + PostActionSheet 단일 인스턴스

## 변경 사항

### 신규 파일
- `frontend/src/stores/postActionStore.ts`: PostActionSheet 상태 관리 store
  - `open({ post, isLiked, isOwner, onLikeToggle })` / `close()` — 앱 전체에서 단일 액션시트 제어

### 수정 파일

#### PostCard 2-column 레이아웃 (`frontend/src/components/PostCard.tsx`)
- **2-column 구조**: 왼쪽 아바타 컬럼 (50px 고정) + 오른쪽 콘텐츠 컬럼
- 닉네임/시간/... 버튼이 오른쪽 컬럼 상단에 한 줄로 배치
- 텍스트 콘텐츠도 오른쪽 컬럼에 배치
- 미디어/태그/액션은 아바타 컬럼 너비만큼 왼쪽 들여쓰기 (`paddingLeft: 16 + 50`)
- PostActionSheet 직접 렌더링 제거 → `usePostActionStore.open()` 호출로 교체
- `useState` 제거 (actionSheetVisible 불필요)

#### PostActionSheet store 기반 전환 (`frontend/src/components/PostActionSheet.tsx`)
- props 기반 → `usePostActionStore` 기반으로 전환
- props 인터페이스 제거, 내부에서 store 직접 읽기
- 좋아요 / 댓글 달기 / 삭제(본인 글만) 기능 유지

#### 단일 인스턴스 (`frontend/app/(tabs)/_layout.tsx`)
- `<PostActionSheet />` 1개만 렌더링 (CreatePostModal 옆)
- 어떤 화면에서 ... 누르든 화면 최하단에서 동일하게 표시

#### Compose prompt 2-column (`frontend/app/(tabs)/index.tsx`)
- PostCard와 동일한 2-column 레이아웃 (아바타 40px + 컨텐츠)
- 시간/좋아요/댓글/... 버튼 없음
- `currentUserId` prop 제거 (PostCard 내부에서 authStore 직접 읽음)

#### 배경색/구분선
- compose card 배경: 흰색
- PostCard 구분선: `#e0e0e0` (진한 회색)

## 검증
- `npx tsc --noEmit` (frontend): 에러 0개
