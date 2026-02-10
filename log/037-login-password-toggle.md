# 037. 로그인 화면 비밀번호 표시 토글 추가

**날짜**: 2026-02-10
**요약**: 로그인 비밀번호 필드에 Ionicons eye 아이콘 토글 버튼 추가

---

## 변경 사항

### `frontend/app/(auth)/login.tsx`

- 비밀번호 입력 필드에 `eye-outline` / `eye-off-outline` 토글 버튼 추가
- 회원가입 화면과 동일한 패턴 (Ionicons SVG 아이콘)

## 참고

- 회원가입/로그인 양쪽 모두 Ionicons (SVG 기반) 사용 — 이모지 아님

## 검증

- ✅ Frontend `tsc --noEmit` — 에러 0개
