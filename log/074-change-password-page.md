# 074 - 비밀번호 변경 페이지 + 로그인 입력 높이 통일

## 요청
1. 프로필 편집 하단에 비밀번호 변경 버튼 추가, 새 페이지에서 비밀번호 변경
2. 로그인 페이지에서 아이디/비밀번호 입력 칸 높이 동일하게

## 수정 내용

### `frontend/app/change-password.tsx` (신규)
- 비밀번호 변경 전용 페이지
- 현재 비밀번호 / 새 비밀번호 / 새 비밀번호 확인 3개 필드
- 각 필드에 비밀번호 표시/숨기기 토글
- 6자 이상 검증, 확인 일치 검증
- 성공 시 Alert 후 뒤로 이동
- 기존 백엔드 API `POST /auth/password-change` 활용

### `frontend/src/components/EditProfileModal.tsx`
- 소개 필드 아래에 "비밀번호 변경" 버튼 추가
- 버튼 탭 시 모달 닫기 → `/change-password` 페이지로 이동
- 자물쇠 아이콘 + 텍스트 + 화살표 아이콘 레이아웃

### `frontend/app/_layout.tsx`
- `change-password` 라우트 등록 (slide_from_right 애니메이션)

### `frontend/app/(auth)/login.tsx`
- 아이디 입력 칸을 비밀번호와 동일한 구조(wrapper View + inner TextInput)로 변경
- `inputContainer` + `inputInner` 스타일이 `passwordContainer` + `passwordInput`과 동일한 구조
- 높이 차이 해소

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
