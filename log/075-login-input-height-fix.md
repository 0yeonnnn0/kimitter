# 075 - 로그인 입력 칸 높이 통일

## 요청
아이디/비밀번호 입력 칸 높이가 다른 문제 수정 (비밀번호 쪽에 눈 아이콘이 있어 더 높음).

## 수정 내용

### `frontend/app/(auth)/login.tsx`
- `inputContainer`와 `passwordContainer` 모두에 `minHeight: 52` 추가
- 눈 아이콘 유무와 관계없이 두 입력 칸이 동일한 최소 높이를 가짐

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
