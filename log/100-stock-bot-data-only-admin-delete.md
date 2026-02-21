# 100 - 주식봇 수치 전용 포맷 + 스케줄 변경 + 관리자 삭제 버튼

## 변경 사항

### 1. 주식봇 프롬프트 — 수치 중심 간결 포맷

**파일**: `bot/src/config/prompts.ts`

기존: 3~5문단, 뉴스 요약, 투자 분석, URL 포함 → 장문 글 생성
변경: 거래량 TOP 리스트 형식, 수치 데이터만 표시, 200자 이내, URL/분석/전망 금지

### 2. 주식봇 Top 5 전체 데이터 전달

**파일**: `bot/src/bots/stockBot.ts`

기존: 1위 종목만 getStockPrice로 상세 조회 → name이 undefined
변경: getTrendingStocks의 Top 5 전체를 rawData로 전달, 별도 상세 조회 제거

### 3. 주식봇 스케줄 — 토요일만 실행

**파일**: `bot/src/scheduler.ts`

기존: `2 8 * * 1` (매주 월요일 08:02 KST)
변경: `2 8 * * 6` (매주 토요일 08:02 KST)
→ 토요일에 글 올림, 일/월은 올리지 않음 (휴일 다음날 제외)

### 4. 관리자 게시물 삭제 버튼 활성화

**파일**: `frontend/src/components/PostCard.tsx`

기존: `isOwner: currentUserId === post.user.id` (본인 글만 삭제 가능)
변경: `isOwner: currentUserId === post.user.id || currentUserRole === 'ADMIN'`
→ 관리자는 모든 게시물에 삭제 버튼 표시 (백엔드는 이미 지원)

### 5. 테스트 스크립트 Top 5 반영

**파일**: `bot/scripts/testStockBot.ts`

1위 상세 조회 대신 Top 5 리스트 rawData 사용, undefined 문제 해결

## 테스트 결과

- **Bot**: 9 suites, 75 tests 전부 통과 / tsc clean
- **Frontend**: tsc clean
