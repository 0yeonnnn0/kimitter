# BottomSheet 공용 컴포넌트 + CreatePostModal 구현

**날짜**: 2026-02-10
**요청**: 글 추가 버튼을 누르면 하단에서 올라오는 방식으로 만들어줘. 화면의 맨 위까지 확장. 컴포넌트로 빼보자.

---

## 변경 사항

### 1. BottomSheet 공용 컴포넌트 생성 (신규)
**파일**: `frontend/src/components/BottomSheet.tsx`

- Animated.spring 기반 하단 슬라이드 업 애니메이션
- `fullScreen` prop: false = 90% 높이 (프로필 편집), true = 100% 전체 화면 (글 작성)
- backdrop fade + 터치 시 닫기
- KeyboardAvoidingView 내장
- handle bar (상단 드래그 인디케이터) 포함

### 2. EditProfileModal 리팩토링
**파일**: `frontend/src/components/EditProfileModal.tsx`

- 자체 Animated 로직 (translateY, backdropOpacity, spring, etc.) 전부 제거
- BottomSheet 래퍼 컴포넌트로 교체 (`fullScreen={false}`)
- 내부 콘텐츠(header, avatar picker, form fields, save 로직)는 그대로 유지
- 불필요한 import 정리 (Animated, Dimensions, KeyboardAvoidingView, Platform 등)

### 3. CreatePostModal 생성 (신규)
**파일**: `frontend/src/components/CreatePostModal.tsx`

- 기존 `create.tsx`의 게시물 작성 UI를 모달 컴포넌트로 추출
- BottomSheet `fullScreen` 모드 사용 (화면 전체 확장)
- Header: 취소 / 새 스레드 / 게시 버튼
- 기능: 텍스트 입력, 이미지/동영상 선택 (ImageManipulator 압축 포함), 태그 추가
- 닫기 시 폼 상태 전체 초기화 (content, tags, media)
- 게시 성공 시 feedStore.addPost + 홈으로 이동
- `as any` → `as unknown as Blob` 타입 개선 (FormData RN quirk)

### 4. 탭바 create 탭 동작 변경
**파일**: `frontend/app/(tabs)/_layout.tsx`

- create 탭 클릭 시 화면 이동 대신 CreatePostModal 오버레이 열기
- `listeners.tabPress`에서 `e.preventDefault()` 후 모달 visible 상태 변경
- CreatePostModal을 `<Tabs>` 외부에서 렌더링

### 5. create.tsx 최소화
**파일**: `frontend/app/(tabs)/create.tsx`

- 기존 전체 게시물 작성 UI 제거
- Expo Router 탭 라우트 유지를 위한 빈 화면만 남김

---

## 검증

- [x] `npx tsc --noEmit` (frontend) — 에러 0개
- [x] `npx tsc --noEmit` (backend) — 에러 0개
