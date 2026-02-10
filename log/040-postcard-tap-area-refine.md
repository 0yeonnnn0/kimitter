# 040. PostCard 터치 영역 개선 — 투명도 피드백 제거 + 태그 영역 추가

**날짜**: 2026-02-10
**요약**: 헤더/액션 바 빈 공간 탭 시 투명도 변화 제거, 태그 영역 빈 공간도 상세 이동

---

## 변경 사항

### `frontend/src/components/PostCard.tsx`

1. **헤더 외곽**: `activeOpacity={0.7}` → `activeOpacity={1}`
   - 빈 공간 탭 시 색상 변화 없이 상세 이동
   - 프로필 이미지/닉네임은 기존 `activeOpacity={0.7}` 유지

2. **태그 영역**: `View` → `TouchableOpacity(activeOpacity=1)`
   - 태그 텍스트가 아닌 빈 공간 탭 시 상세 이동
   - 태그 자체는 향후 태그 검색으로 연결 가능

3. **액션 바 외곽**: `activeOpacity={0.7}` → `activeOpacity={1}`
   - 빈 공간 탭 시 색상 변화 없이 상세 이동
   - 좋아요/댓글 버튼은 `activeOpacity={0.7}` 추가하여 개별 피드백 유지

## 검증

- ✅ Frontend `tsc --noEmit` — 에러 0개
