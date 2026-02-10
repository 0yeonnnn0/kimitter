# 036. 회원가입 화면 placeholder 개선 + 비밀번호 표시 토글

**날짜**: 2026-02-10
**요약**: 회원가입 입력 필드 placeholder를 구체적 안내 문구로 변경, 비밀번호 필드에 눈 아이콘 토글 추가

---

## 변경 사항

### `frontend/app/(auth)/register.tsx`

1. **Placeholder 변경**
   - 아이디 → `아이디 (로그인 시 사용)`
   - 닉네임 → `닉네임 (실명 또는 가족 내 별칭을 적어주세요)`

2. **비밀번호 표시/숨기기 토글**
   - 비밀번호, 비밀번호 확인 필드에 눈 아이콘 버튼 추가
   - `eye-outline` ↔ `eye-off-outline` (Ionicons) 토글
   - 각 필드 독립적으로 토글 가능

## 검증

- ✅ Frontend `tsc --noEmit` — 에러 0개
