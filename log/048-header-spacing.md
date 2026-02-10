# 048 - 전체 페이지 상단 헤더 여백 확대

## 변경 사항

모든 페이지의 헤더 paddingTop/paddingBottom을 통일하여 확대.

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| `app/(tabs)/index.tsx` (홈) | paddingTop: 56, paddingBottom: 12 | paddingTop: 72, paddingBottom: 16 |
| `app/(tabs)/search.tsx` (검색) | paddingTop: 56, paddingBottom: 12 | paddingTop: 72, paddingBottom: 16 |
| `app/(tabs)/activity.tsx` (활동) | paddingTop: 56, paddingBottom: 12 | paddingTop: 72, paddingBottom: 16 |
| `app/(tabs)/profile.tsx` (프로필) | paddingTop: 56, paddingBottom: 12 | paddingTop: 72, paddingBottom: 16 |
| `app/user/[userId].tsx` (타인 프로필) | paddingTop: 56, paddingBottom: 12 | paddingTop: 72, paddingBottom: 16 |
| `app/[postId]/index.tsx` (글 상세) | paddingTop: 64, paddingBottom: 14 | paddingTop: 72, paddingBottom: 16 |
