# 035. 중복 초대 시 기존 코드 표시

**날짜**: 2026-02-10
**요약**: 동일 이메일 재초대 시 400 에러 대신 기존 초대 코드를 팝업으로 표시

---

## 변경 사항

1. **adminService.ts (백엔드)**: 미사용 초대 코드가 이미 존재하면 에러를 던지지 않고 기존 코드를 `reused: true`와 함께 반환
2. **adminService.ts (프론트)**: `InviteResult` 타입에 `reused` 필드 추가
3. **InviteModal.tsx**: `reused === true`일 때 "기존 초대 코드" 팝업에 코드 표시

## 검증

- ✅ Backend `tsc --noEmit` — 에러 0개
- ✅ Frontend `tsc --noEmit` — 에러 0개
