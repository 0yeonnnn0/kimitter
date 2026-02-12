# 078: Edit Profile Modal Fullscreen

## Summary
Added `fullScreen` prop to BottomSheet in EditProfileModal to prevent keyboard overlap and extend modal to safe area top.

## Changes

### File: `frontend/src/components/EditProfileModal.tsx`
- **Line 102**: Added `fullScreen` prop to BottomSheet component
  - BEFORE: `<BottomSheet visible={visible} onClose={onClose}>`
  - AFTER: `<BottomSheet visible={visible} onClose={onClose} fullScreen>`

## Rationale
- Consistent with InviteModal implementation (already has fullScreen prop)
- BottomSheet component already supports fullScreen prop with safe area inset handling
- Resolves keyboard overlap issue by extending modal to `top: insets.top`
- Improves UX for profile editing with keyboard input

## Verification
- ✅ `npx tsc --noEmit` passed (no type errors)
- ✅ BottomSheet interface accepts optional `fullScreen` boolean prop
- ✅ No breaking changes (prop defaults to false)

## Related
- InviteModal: `frontend/src/components/InviteModal.tsx:68` (already implemented)
- BottomSheet: `frontend/src/components/BottomSheet.tsx` (component definition)
