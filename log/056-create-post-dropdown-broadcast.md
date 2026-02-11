# 056. CreatePostModal 드롭다운 + 알림 보내기 기능

## 변경 사항

### 백엔드 (이전 세션에서 완료)
- `backend/src/services/notificationService.ts`: `broadcastNotification()` 함수 추가 (모든 active 유저에게 CUSTOM 알림 + 푸시)
- `backend/src/controllers/notificationController.ts`: `broadcastNotification` 핸들러 추가
- `backend/src/validations/notificationValidation.ts`: `broadcastNotificationSchema` (message: 1~80자)
- `backend/src/routes/notifications.ts`: `POST /notifications/broadcast` 라우트 추가

### 프론트엔드 서비스 (이전 세션에서 완료)
- `frontend/src/services/notificationService.ts`: `broadcastNotification(message)` API 함수 추가

### 프론트엔드 CreatePostModal (이번 세션 완료)
- `frontend/src/components/CreatePostModal.tsx`:
  - **모드 시스템 추가**: `type Mode = 'post' | 'notify'` — 새 글 쓰기 / 알림 보내기 전환
  - **드롭다운 헤더**: "새 스레드" 텍스트 → 드롭다운 버튼으로 교체 (chevron-down 아이콘)
  - **handleSubmit 분기**: `handleSubmitPost` (기존 게시물 작성), `handleSubmitNotification` (broadcastNotification API 호출)
  - **모드별 본문 UI**:
    - `post` 모드: 기존 텍스트 입력 + 미디어 + 태그 (2000자 제한)
    - `notify` 모드: 80자 제한, "모두에게 알림을 보낼 수 있습니다" placeholder, 글자수 표시, 미디어/태그 숨김
  - **게시 버튼 텍스트**: 모드별 분기 ('게시' / '보내기')
  - **인라인 드롭다운**: Modal 대신 헤더 바로 아래 absolute positioned 드롭다운 (create-outline / notifications-outline 아이콘, 선택 항목 체크마크)
  - **selectMode 함수**: 모드 전환 시 content/tags/media 초기화
  - **Pressable 래퍼**: 본문 터치 시 드롭다운 자동 닫힘
  - **새 스타일**: headerWrapper, titleDropdown, notifyBody, notifyInput, charCount, bodyScroll, dropdownMenu (absolute), dropdownItem, dropdownItemActive, dropdownText, dropdownTextActive, dropdownDivider

## 검증
- `npx tsc --noEmit` (frontend): 에러 0개
- `npx tsc --noEmit` (backend): 에러 0개
