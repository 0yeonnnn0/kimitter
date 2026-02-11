# 064 - 프로필 이미지 확대 보기

## 요청

유저 프로필 / 내 프로필에서 프로필 사진을 클릭하면 확대 보기가 가능하도록.

## 변경 사항

### 신규: `frontend/src/components/ImageViewerModal.tsx`

- 풀스크린 모달로 프로필 이미지 확대 표시
- 검정 배경 (`rgba(0,0,0,0.95)`)에 `resizeMode="contain"`
- 위/아래 스와이프로 닫기 (PanResponder, 120px 이상 이동 시 dismiss)
- 스와이프 중 배경 opacity 페이드 효과
- 우측 상단 X 버튼으로도 닫기 가능
- 재사용 가능한 컴포넌트 (`visible`, `imageUrl`, `onClose` props)

### 수정: `frontend/app/(tabs)/profile.tsx`

- 프로필 아바타를 `TouchableOpacity`로 감쌈
- `imageViewerVisible` state 추가
- 프로필 이미지가 있을 때만 탭 활성화 (`disabled={!user.profileImageUrl}`)
- `ImageViewerModal` 렌더링 추가

### 수정: `frontend/app/user/[userId].tsx`

- 동일한 패턴 적용 (TouchableOpacity + ImageViewerModal)

## 검증

- `npx tsc --noEmit`: 에러 0개
