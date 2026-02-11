# 071 - aps-environment 인타이틀먼트 에러 수정

## 요청
앱 시작 시 `aps-environment` 인타이틀먼트 관련 에러로 크래시 발생.

## 원인
`usePushNotifications` 훅에서 `registerForPushNotifications()` 호출이 try-catch 밖에 있어서,
Expo Go나 시뮬레이터 등 APS 인타이틀먼트가 없는 환경에서 `getExpoPushTokenAsync()`가
throw한 에러가 unhandled promise rejection이 됨.

## 수정 내용

### `frontend/src/hooks/usePushNotifications.ts`
- `setup()` 내에서 `registerForPushNotifications()` 호출과 `registerPushToken()` 호출을
  하나의 try-catch로 감쌈
- 푸시 알림 설정 실패 시 앱 크래시 없이 조용히 무시 (다음 실행 시 재시도)

## 검증
- `npx tsc --noEmit` 프론트엔드 — 에러 0개
