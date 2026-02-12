# 076 - 가족 초대 모달 풀스크린으로 변경

## 요청
초대하기 모달에서 키보드가 올라올 때 입력 칸이 가려지는 문제. 모달을 최상위까지 올려달라.

## 수정 내용

### `frontend/src/components/InviteModal.tsx`
- `BottomSheet`에 `fullScreen` prop 추가
- 모달이 상단 safe area 바로 아래까지 올라가서 키보드에 가려지지 않음

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
