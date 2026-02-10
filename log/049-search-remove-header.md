# 049 - 검색 탭 '검색' 헤더 텍스트 제거

## 변경 사항

### `frontend/app/(tabs)/search.tsx`
- "검색" 헤더 텍스트 및 헤더 View 블록 제거
- 검색바(searchSection)에 `paddingTop: 72` 추가하여 상단 여백 유지
- 사용하지 않는 `header`, `headerTitle` 스타일 제거
