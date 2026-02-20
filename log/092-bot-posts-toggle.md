# 092 — 봇 글 보기 토글 기능

**날짜**: 2026-02-21

## 변경 사항

### 기능
홈 화면 햄버거 메뉴(HomeSidebar) 최상단에 "봇 글 보기" 토글 스위치 추가.
토글 OFF 시 BOT 역할 유저의 게시물을 피드에서 숨김.

### 파일 변경

| 파일 | 변경 |
|------|------|
| `frontend/src/stores/feedStore.ts` | `showBotPosts` state (기본: true) + `toggleShowBotPosts()` action 추가 |
| `frontend/src/components/HomeSidebar.tsx` | 사이드바 상단에 Switch 토글 UI 추가, feedStore 연동 |
| `frontend/app/(tabs)/index.tsx` | `useMemo`로 `filteredPosts` 생성, BOT 글 클라이언트 필터링 |

### 구현 방식
- 클라이언트 사이드 필터링: `posts.filter(p => p.user.role !== 'BOT')`
- `useMemo`로 불필요한 재계산 방지
- Zustand store에 상태 저장 (앱 재시작 시 초기화 — 기본값 true)

## 검증
- `npx tsc --noEmit` 통과
