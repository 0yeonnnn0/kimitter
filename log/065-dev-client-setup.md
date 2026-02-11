# 065 - Development Build 설정

## 요청

expo-notifications 경고 해결을 위해 Expo Go 대신 development build 환경 구성.

## 배경

SDK 53부터 `expo-notifications`의 푸시 알림 기능이 Expo Go에서 제거됨. development build를 사용해야 완전한 기능 지원.

## 변경 사항

### `frontend/package.json`

- `expo-dev-client` 패키지 설치

### `frontend/eas.json`

- `development` 프로필 추가: iOS 시뮬레이터용 (`simulator: true`)
- `development-device` 프로필 추가: 실제 기기용 (APK 배포)
- 기존 `preview`, `production` 프로필 유지

## 사용 방법

```bash
# iOS 시뮬레이터용 development build
eas build --profile development --platform ios

# Android 실기기용 development build (APK)
eas build --profile development-device --platform android

# 빌드 완료 후 개발 서버 실행
npx expo start --dev-client
```

## 검증

- `npx tsc --noEmit`: 에러 0개
