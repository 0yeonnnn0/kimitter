# 068 - 댓글/답글 크기 증가

## 요청
댓글 각각의 세로 크기를 키우고, 답글 버튼을 더 크게, 전체 글자 크기를 약간 증가시켜 달라.

## 수정 파일

### `frontend/app/[postId]/index.tsx`
댓글/답글 영역 스타일 조정:

| 속성 | 변경 전 | 변경 후 |
|------|---------|---------|
| `commentItem.paddingVertical` | 8 | 14 |
| `commentNickname.fontSize` | 13 | 15 |
| `commentContent.fontSize` | 14 | 15 |
| `commentContent.marginTop` | 2 | 4 |
| `commentContent.lineHeight` | (없음) | 22 |
| `commentActions.gap` | 12 | 14 |
| `commentActions.marginTop` | 4 | 8 |
| `commentDate.fontSize` | 12 | 13 |
| `replyButton.fontSize` | 12 | 14 |
| `replyButton.fontWeight` | (없음) | '600' |
| `replyItem.marginTop` | 8 | 12 |

## 검증
- `npx tsc --noEmit` — 에러 0개
