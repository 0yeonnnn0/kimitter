# 039. PostCard 터치 영역 확대

**날짜**: 2026-02-10
**요약**: 홈 피드 PostCard에서 상세 화면으로 이동할 수 있는 터치 영역 확대

---

## 변경 사항

### `frontend/src/components/PostCard.tsx`

- **헤더 영역**: 작성자/날짜 오른쪽 빈 공간 탭 → 상세 이동
  - `View` → `TouchableOpacity`로 변경 (onPress=navigateToDetail)
  - 프로필 이미지/닉네임은 기존대로 프로필 이동 (내부 TouchableOpacity 우선)
- **액션 바 영역**: 좋아요/댓글 아이콘 오른쪽 빈 공간 탭 → 상세 이동
  - `View` → `TouchableOpacity`로 변경 (onPress=navigateToDetail)
  - 좋아요 버튼, 댓글 버튼은 기존 동작 유지 (내부 TouchableOpacity 우선)

## 터치 우선순위

- 프로필 이미지/닉네임 탭 → 프로필 페이지
- 좋아요 아이콘 탭 → 좋아요 토글
- 댓글 아이콘 탭 → 상세 이동
- 그 외 헤더/액션 바 빈 영역 탭 → 상세 이동

## 검증

- ✅ Frontend `tsc --noEmit` — 에러 0개
