# 046 - 전송 버튼 아이콘 변경 + 높이 통일

## 변경 사항

### `frontend/app/[postId]/index.tsx`

- "전송" 텍스트 → `Ionicons` `send` 아이콘 (SVG 기반)으로 변경
- 전송 버튼 크기: width/height 48px 원형으로 변경 (댓글 입력 minHeight: 48과 동일)
- 불필요해진 `sendButtonText` 스타일 제거
