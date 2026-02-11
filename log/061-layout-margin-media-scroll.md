# 061. 레이아웃 마진 축소 + 이미지 스크롤 시 아바타 영역 오버랩

## 변경 사항

### PostCard (`frontend/src/components/PostCard.tsx`)
- `paddingHorizontal` 16→12, `paddingTop` 16→14 (좌우 여백 축소)
- `AVATAR_GAP` 10→8 (아바타-콘텐츠 간격 축소)
- `SIDE_PADDING` 상수화 (12)
- MediaGallery를 `belowAvatar` 래퍼 밖으로 분리 → 풀 너비 렌더링
- `paddingLeft={SIDE_PADDING + AVATAR_COL}` prop으로 이미지 시작 위치 제어

### MediaGallery (`frontend/src/components/MediaGallery.tsx`)
- `paddingLeft` optional prop 추가 (기본값: 기존 HORIZONTAL_PADDING 16)
- ScrollView의 `contentContainerStyle`을 인라인으로 변경 (`paddingLeft: leftPad`)
- 스크롤 시 이미지가 왼쪽 아바타 영역 위를 넘어서 표시 가능 (ScrollView 자체는 풀 너비)

### index.tsx compose prompt
- `paddingHorizontal` 16→12, `paddingVertical` 16→14
- `composeAvatarCol` width 50→48 (PostCard와 동일한 비율)

## 동작
- 이미지 1장: 콘텐츠 영역에서 시작, 풀 너비
- 이미지 여러 장: 콘텐츠 영역에서 시작, 좌로 스크롤 시 아바타 컬럼 위까지 오버랩

## 검증
- `npx tsc --noEmit` (frontend): 에러 0개
