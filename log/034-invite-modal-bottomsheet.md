# 034. 유저 초대 BottomSheet 모달로 변경

**날짜**: 2026-02-10
**요약**: 프로필 편집 버튼 옆에 "유저 초대하기" 버튼 추가, BottomSheet 모달로 초대 UI 분리

---

## 변경 사항

### 프론트엔드

1. **InviteModal 컴포넌트 생성** (`src/components/InviteModal.tsx`)
   - 기존 BottomSheet 컴포넌트를 사용 (EditProfileModal과 동일 패턴)
   - 하단에서 반쯤 올라오는 모달
   - 헤더: 취소 / 가족 초대하기 / 초대 버튼
   - 메일 아이콘 + 설명 텍스트 + 이메일 입력 필드
   - 초대 성공 시 자동 닫힘

2. **프로필 화면 수정** (`app/(tabs)/profile.tsx`)
   - Admin: "프로필 편집" + "유저 초대하기" 버튼 가로 배치 (flex: 1, gap: 8)
   - 일반 유저: 기존 "프로필 편집" 버튼만 표시
   - 인라인 초대 섹션(이메일 입력 + 전송 버튼) 제거 → InviteModal로 대체
   - 불필요한 import 정리 (TextInput, adminService 제거)

## 검증

- ✅ Frontend `tsc --noEmit` — 에러 0개
- ✅ Backend `tsc --noEmit` — 에러 0개
