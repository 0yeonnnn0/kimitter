# 062 - 단독 이미지 가로 폭 레이아웃 맞춤

## 요청

단독 이미지일 때 가로 길이를 현재 2-column 레이아웃에 맞게 맞춰달라.

## 변경 사항

### `frontend/src/components/MediaGallery.tsx`

- **`SINGLE_IMAGE_WIDTH` 상수 제거**: 기존에는 `SCREEN_WIDTH - HORIZONTAL_PADDING * 2`로 고정되어 있어 2-column 레이아웃의 `paddingLeft`를 반영하지 못했음
- **동적 `singleWidth` 계산 추가**: `SCREEN_WIDTH - leftPad - HORIZONTAL_PADDING`으로 변경하여 `paddingLeft` prop 값에 맞춰 단독 이미지 폭이 결정됨
- `leftPad`는 기존 `paddingLeft` prop에서 파생 (기본값: `HORIZONTAL_PADDING = 16`)

## 검증

- `npx tsc --noEmit`: 에러 0개
