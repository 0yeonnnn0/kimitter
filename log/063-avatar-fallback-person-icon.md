# 063 - 기본 아바타를 person 아이콘으로 통일

## 요청

프로필 사진이 없을 때 닉네임 첫 글자를 보여주는 폴백을 제거하고, "새로운 소식이 있나요?" compose prompt와 동일한 person 아이콘을 기본 이미지로 사용.

## 변경 사항

### 공통 변경 패턴

- `nickname[0]` 텍스트 폴백 → `<Ionicons name="person" size={N} color="#999" />` 아이콘으로 교체
- 폴백 배경색 `#000` (검정) → `#e8e8e8` (밝은 회색)으로 통일
- 불필요한 `avatarText` 스타일 제거

### 수정 파일 (7개)

| 파일 | 아바타 크기 | 아이콘 크기 |
|------|-----------|-----------|
| `src/components/PostCard.tsx` | 40px | 20 |
| `src/components/EditProfileModal.tsx` | 88px | 44 |
| `app/(tabs)/profile.tsx` | 72px | 36 |
| `app/(tabs)/search.tsx` | 44px | 22 |
| `app/(tabs)/activity.tsx` | 40px | 20 |
| `app/user/[userId].tsx` | 72px | 36 |
| `app/[postId]/index.tsx` (post) | 44px | 22 |
| `app/[postId]/index.tsx` (comment/reply) | 32px | 16 |

### 추가 개선

- **`activity.tsx`**: 기존에 profileImageUrl 분기가 없었음 → Image + 조건 분기 추가 (Ionicons, Image, getFileUrl import 추가)
- **`[postId]/index.tsx`**: 댓글/답글 아바타에도 profileImageUrl 분기 추가 + `commentAvatarImage` 스타일 추가

## 검증

- `npx tsc --noEmit`: 에러 0개
