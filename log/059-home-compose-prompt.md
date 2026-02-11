# 059. 홈 화면 상단 글 작성 프롬프트 UI

## 변경 사항

### 신규 파일
- `frontend/src/stores/createModalStore.ts`: 글 작성 모달 open/close 상태를 공유하는 Zustand store
  - `visible`, `open()`, `close()` — 홈 화면과 탭 레이아웃 모두에서 모달 제어 가능

### 수정 파일
- `frontend/app/(tabs)/_layout.tsx`:
  - `useState` → `useCreateModalStore`로 교체
  - 기존 동작 동일 (+ 탭 누르면 모달 열림)

- `frontend/app/(tabs)/index.tsx`:
  - `FlatList`의 `ListHeaderComponent`로 compose prompt 카드 추가
  - 원형 프로필 이미지 (또는 기본 아이콘 fallback) + 닉네임(볼드) + "새로운 소식이 있나요?" 회색 텍스트
  - 탭 시 `useCreateModalStore.open()` 호출 → 글 작성 모달 오픈 (하단 + 버튼과 동일 동작)
  - 새 스타일: composeCard, composeAvatar, composeAvatarFallback, composeTextArea, composeNickname, composePlaceholder

## 검증
- `npx tsc --noEmit` (frontend): 에러 0개
