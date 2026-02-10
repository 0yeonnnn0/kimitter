# 044 - 검색/프로필 탭 pull-to-refresh + 스와이프 뒤로가기 범위 확대

## 변경 사항

### 1. 검색 탭 pull-to-refresh (`frontend/app/(tabs)/search.tsx`)
- `RefreshControl` import 추가
- `refreshing` state 추가
- `handleRefresh` 함수: 현재 검색 모드(태그/유저/게시물)와 선택된 태그에 따라 데이터를 다시 가져옴
- 3개 FlatList(태그 목록, 유저 목록, 게시물 목록) 모두에 `RefreshControl` 적용

### 2. 프로필 탭 pull-to-refresh (`frontend/src/components/ProfileTabs.tsx`)
- `RefreshControl` import 추가
- `refreshing` state 추가
- `handleRefresh` 함수: 현재 활성 탭(스레드/답글/미디어)의 데이터를 다시 가져옴
- FlatList에 `RefreshControl` 적용
- ProfileTabs는 본인 프로필과 타인 프로필 모두에서 공용으로 사용되므로 양쪽 모두 자동 적용

### 3. 스와이프 뒤로가기 범위 확대 (`frontend/app/_layout.tsx`)
- `gestureResponseDistance: 50` → `gestureResponseDistance: { start: 50 }` 타입 수정
- `GestureResponseDistanceType`은 `{ start?, end?, top?, bottom? }` 객체 타입

## 적용 범위
- 검색 탭: 태그 검색 결과, 유저 검색 결과, 게시물 검색 결과
- 본인 프로필: 스레드, 답글, 미디어 탭
- 타인 프로필: 스레드, 답글, 미디어 탭
- 글 상세 → 뒤로가기 스와이프 인식 범위 50px (기본값 ~25px의 2배)
