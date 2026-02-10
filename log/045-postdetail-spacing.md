# 045 - 글 상세 페이지 여백 및 댓글 입력 크기 조정

## 변경 사항

### `frontend/app/[postId]/index.tsx`

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 상단 헤더 paddingTop | 56 | 64 |
| 상단 헤더 paddingBottom | 12 | 14 |
| 하단 commentInputRow padding | 12 (전방향) | paddingHorizontal: 12, paddingTop: 12, paddingBottom: 36 |
| 댓글 입력 paddingVertical | 10 | 14 |
| 댓글 입력 minHeight | (없음) | 48 |
| 댓글 입력 maxHeight | 100 | 120 |
