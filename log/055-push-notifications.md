# 055 - 푸시 알림 연동 (expo-notifications)

**날짜**: 2026-02-11  
**요청**: expo-notifications를 활용해 유저의 알림이 활성화되면 푸시알림을 보낼 수 있도록 구현

---

## 변경 사항

### 백엔드

#### `notificationService.ts`
- `sendPushNotification` 함수를 `export`로 변경하여 다른 서비스에서 사용 가능하게 함

#### `commentService.ts`
- 댓글 작성 시 글 작성자에게 푸시 알림 발송 (`{닉네임}님이 댓글을 남겼습니다`)
- 답글 작성 시 부모 댓글 작성자에게 푸시 알림 발송 (`{닉네임}님이 답글을 남겼습니다`)
- `createComment`, `createReply` 모두 적용

#### `likeService.ts`
- 게시물 좋아요 시 글 작성자에게 푸시 알림 발송
- 댓글 좋아요 시 댓글 작성자에게 푸시 알림 발송
- 본인 글/댓글에 좋아요 시에는 알림 미발송 (기존 로직 유지)

### 프론트엔드

#### `app.json`
- `expo-notifications` 플러그인 추가
- iOS `bundleIdentifier` 추가 (`com.kimitter.app`)

#### `src/hooks/usePushNotifications.ts` (신규)
- 로그인 시 자동으로 푸시 알림 권한 요청
- Expo Push Token 발급 → 백엔드 API로 등록 (`POST /notifications/register-token`)
- 포그라운드 알림 표시 (alert, sound, badge)
- 알림 탭 시 해당 게시물로 네비게이션 (`data.postId` 기반)
- Android 알림 채널 설정 (default, MAX importance)
- 시뮬레이터에서는 자동으로 스킵 (물리 기기만 지원)

#### `app/_layout.tsx`
- `usePushNotifications(isLoggedIn)` 훅 연결

#### `expo-device` 패키지 설치
- 물리 기기 판별을 위한 의존성 추가

---

## 푸시 알림 발송 시나리오

| 이벤트 | 수신자 | 푸시 메시지 |
|--------|--------|-------------|
| 댓글 작성 | 글 작성자 | `{닉네임}님이 댓글을 남겼습니다` + 댓글 내용 |
| 답글 작성 | 부모 댓글 작성자 | `{닉네임}님이 답글을 남겼습니다` + 답글 내용 |
| 게시물 좋아요 | 글 작성자 | `{닉네임}님이 회원님의 게시물을 좋아합니다.` |
| 댓글 좋아요 | 댓글 작성자 | `{닉네임}님이 회원님의 댓글을 좋아합니다.` |
| 게시물 알림 | 선택된 수신자들 | 커스텀 메시지 (기존 POST_MENTION) |

---

## 수정 파일

| 파일 | 변경 |
|------|------|
| `backend/src/services/notificationService.ts` | `sendPushNotification` export |
| `backend/src/services/commentService.ts` | 댓글/답글 푸시 알림 추가 |
| `backend/src/services/likeService.ts` | 좋아요 푸시 알림 추가 |
| `frontend/app.json` | expo-notifications 플러그인, bundleIdentifier |
| `frontend/src/hooks/usePushNotifications.ts` | 신규 — 푸시 알림 훅 |
| `frontend/app/_layout.tsx` | usePushNotifications 훅 연결 |
| `frontend/package.json` | expo-device 의존성 추가 |

---

## 검증

- `npx tsc --noEmit` (frontend) — 에러 0개
- `npx tsc --noEmit` (backend) — 에러 0개

## 참고

- 시뮬레이터에서는 푸시 알림이 동작하지 않음 (물리 기기 필요)
- Expo Go에서는 projectId 없이 동작, EAS 빌드 시 projectId 설정 필요
