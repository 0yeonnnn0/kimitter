# 094 — 게시물 API에 user.role 필드 추가 (봇 글 필터링 수정)

**날짜**: 2026-02-21

## 문제
- "봇 글 보기" 토글을 꺼도 봇 게시물이 계속 표시됨
- 원인: 백엔드 Prisma `postInclude`에서 `user.role`을 select하지 않아 API 응답에 role 필드 누락
- 프론트에서 `p.user.role`이 `undefined` → `undefined !== 'BOT'`이 항상 true → 필터 작동 안 함

## 수정
모든 게시물 조회 쿼리의 user select에 `role: true` 추가:

| 파일 | 수정 위치 |
|------|----------|
| `backend/src/services/postService.ts` | `postInclude` (피드, 상세, 검색) |
| `backend/src/services/tagService.ts` | `postInclude` (태그별 게시물) |
| `backend/src/services/userService.ts` | 유저 게시물 3곳 (스레드, 답글, 미디어) |

## 영향
- 봇 글 보기 토글 정상 작동
- BotBadge 컴포넌트도 role 필드 필요 → 함께 해결됨

## 검증
- `npx tsc --noEmit` 통과 (backend)
- 기존 테스트 실패 2건은 이전 변경(BOT 로그인 해제, getPostById 시그니처)에 의한 것으로 본 수정과 무관

## 배포 필요
- 백엔드 Docker 이미지 재빌드 + NAS 배포 필요
