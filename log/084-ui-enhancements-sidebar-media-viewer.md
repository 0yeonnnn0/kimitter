# 084 - UI 개선: 사이드바, 활동 탭 분리, 미디어 뷰어, Android UX

## 변경 파일

### 새 파일
- `frontend/src/components/SidebarMenu.tsx` — 프로필 설정 사이드바 (관리자 유저 목록, 비밀번호 변경, 로그아웃)
- `frontend/src/components/HomeSidebar.tsx` — 홈 유저 목록 사이드바 (탭 시 해당 유저 프로필 이동)

### 수정 파일
- `frontend/app/(tabs)/profile.tsx` — 로그아웃 아이콘 → 설정 아이콘으로 변경, SidebarMenu 연동
- `frontend/app/(tabs)/index.tsx` — 헤더에 검색/햄버거 아이콘 추가, HomeSidebar 연동, Android 뒤로가기 2번 종료
- `frontend/app/(tabs)/activity.tsx` — 활동/알림 탭 분리 (COMMENT/REPLY/LIKE vs CUSTOM)
- `frontend/app/(tabs)/_layout.tsx` — Android 하단 탭바 최소 paddingBottom 16px 보장
- `frontend/src/components/BottomSheet.tsx` — Android 뒤로가기 시 모달 닫기
- `frontend/src/components/MediaGallery.tsx` — 풀스크린 뷰어 전면 재작성 (PanResponder 기반)
- `frontend/src/components/PostCard.tsx` — MediaGallery에 onPressBackground 전달
- `frontend/src/services/adminService.ts` — getAllUsers 함수 추가

## 주요 변경 내용

### 프로필 설정 사이드바
- 로그아웃 아이콘을 설정(gear) 아이콘으로 변경
- 오른쪽에서 슬라이드인되는 사이드바 메뉴
- 관리자: 모든 유저 목록 표시
- 비밀번호 변경, 로그아웃 메뉴

### 홈 헤더 + 유저 사이드바
- 헤더 오른쪽에 검색 아이콘 + 햄버거 메뉴 추가
- 햄버거 메뉴: 유저 목록 표시, 탭 시 해당 유저 프로필로 이동

### Android 뒤로가기 UX
- 홈에서 뒤로가기 2번 누르면 앱 종료 (ToastAndroid 안내)
- 글 작성 모달(BottomSheet)에서 뒤로가기 시 모달 닫기

### 활동 페이지 탭 분리
- 왼쪽 탭: 글 관련 활동 (댓글, 좋아요, 멘션)
- 오른쪽 탭: 커스텀 알림
- 각 탭에 읽지 않은 알림 뱃지 표시

### 미디어 뷰어 전면 재작성
- ScrollView 전부 제거, PanResponder가 모든 제스처 처리
- 한 손가락 드래그: 상하좌우 자유 이동 → 320px 초과 시 dismiss
- 더블탭: 2.5x ↔ 1x 줌 토글
- 두 손가락 핀치: 실시간 확대/축소 (1x~4x)
- 여러 장: 가로 스와이프로 이미지 전환 + 페이지 인디케이터
- 사진 1장일 때 피드에서 좌우 스크롤 비활성화
- 사진 바깥 영역 탭 시 글 상세 페이지로 이동 (onPressBackground)

### 하단 탭바 잘림 수정
- Android에서 최소 paddingBottom 16px 보장 (insets.bottom이 0인 폰 대응)
