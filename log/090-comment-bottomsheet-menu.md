# 090 — 댓글 수정/삭제 BottomSheet 메뉴

**날짜**: 2026-02-21

## 변경 사항

### `frontend/app/[postId]/index.tsx`

#### 기능 추가
- 댓글/대댓글에 세로 `...` 버튼 추가 (본인 글 또는 ADMIN만 표시)
- 버튼 클릭 시 BottomSheet 모달로 수정/삭제 메뉴 표시
- 기존 시스템 Alert 기반 메뉴를 커스텀 BottomSheet로 교체

#### 상세 구현
1. **State 추가**: `menuComment` — BottomSheet 표시 대상 댓글 관리
2. **`showCommentMenu(comment, parentId?)`**: 댓글/대댓글 구분하여 메뉴 열기
3. **`handleMenuEdit()`**: 수정 모드 진입 (인라인 TextInput)
4. **`handleMenuDelete()`**: 삭제 확인 Alert → API 호출 → UI 반영
5. **BottomSheet JSX**: PostActionSheet와 동일한 스타일 패턴 적용
   - 본인 댓글: 수정 + 삭제 옵션
   - ADMIN (타인 댓글): 삭제 옵션만
6. **스타일 추가**: `menuContainer`, `menuItem`, `menuItemText`, `menuDivider`

#### 기존 기능 유지
- 인라인 댓글 수정 (TextInput + 저장/취소)
- 댓글 삭제 확인 Alert
- `canManage()` 권한 체크 (본인 또는 ADMIN)

## 검증
- `npx tsc --noEmit` 통과
