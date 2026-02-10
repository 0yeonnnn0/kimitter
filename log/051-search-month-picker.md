# 051 - 검색 탭 캘린더 아이콘 월 이동 기능

## 변경 사항

### `frontend/app/(tabs)/search.tsx`

**새로운 기능: 월 이동 버튼**

- 필터 버튼 행(태그, 유저 옆)에 `calendar-outline` 아이콘 + "월 이동" 버튼 추가
- 검색 전(갤러리 화면)에서만 표시, 검색 후에는 숨김
- 게시물이 있는 월이 없으면 버튼 숨김

**월 선택 모달 (BottomSheet 스타일)**

- 하단에서 올라오는 반투명 오버레이 모달
- 게시물이 존재하는 월 목록을 스크롤 가능한 리스트로 표시
- 각 항목: 캘린더 아이콘 + "2026년 2월" 형태 라벨
- 월 선택 시 → `FlatList.scrollToIndex()`로 해당 월 헤더까지 스크롤
- 오버레이 터치로 모달 닫기

**기술 구현**

- `galleryListRef`: FlatList ref로 프로그래밍 방식 스크롤 제어
- `availableMonths`: galleryRows에서 header type만 추출한 월 라벨 배열
- `scrollToMonth`: 해당 월의 header row index를 찾아 scrollToIndex 호출
- `onScrollToIndexFailed`: 아직 렌더링되지 않은 영역 스크롤 시 300ms 후 재시도
