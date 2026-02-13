# 085 - 캘린더(일정) 프론트엔드 구현 — 검색 탭 교체

## 변경 파일

### 새 파일
- `frontend/app/(tabs)/schedule.tsx` — 캘린더 페이지 (월별 뷰, 일정 목록, 생성/수정/삭제 모달)
- `frontend/src/services/scheduleService.ts` — 스케쥴 API 서비스 (CRUD)

### 수정 파일
- `frontend/app/(tabs)/_layout.tsx` — search 탭을 schedule(캘린더) 탭으로 교체, search는 href:null로 숨김
- `frontend/src/types/models.ts` — Schedule 인터페이스 추가

## 주요 변경 내용

### 캘린더 페이지 (schedule.tsx)
- 월별 캘린더 그리드 (6주 고정, 일~토)
- 일요일 빨간색, 토요일 파란색 텍스트
- 오늘 날짜 회색 원, 선택 날짜 검정 원 + 흰 텍스트
- 일정이 있는 날짜에 색상 점 표시 (최대 3개)
- 날짜 탭 시 해당 일의 일정 목록 표시
- FAB 버튼(+)으로 일정 생성 모달 열기
- 일정 생성/수정 모달: 제목, 시작일, 종료일, 메모, 색상 선택
- 8가지 프리셋 색상 선택
- 본인 일정 탭 시 수정, 길게 누르면 삭제
- 관리자도 삭제 가능
- Pull-to-refresh 지원
- 월 이동 (좌우 화살표)

### 탭 변경
- 하단 탭바: 검색(돋보기) → 캘린더 아이콘으로 변경
- search.tsx 파일은 유지하되 탭에서 숨김 (href: null)
- 홈 헤더의 검색 아이콘으로 search 페이지 접근 가능

### 참고
- 백엔드 API 미구현 상태 — UI만 선 구현
- 백엔드 구현 후 바로 연동 가능하도록 scheduleService.ts 준비 완료
