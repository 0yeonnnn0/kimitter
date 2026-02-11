# 057. EAS Build Android APK 설정

## 변경 사항

### 신규 파일
- `frontend/eas.json`: EAS Build 설정 파일 생성
  - `preview` 프로필: `distribution: "internal"`, `buildType: "apk"` — 링크로 APK 직접 다운로드 가능
  - `production` 프로필: 기본 (AAB, Play Store 배포용)

### 수정 파일
- `frontend/app.json`: `android.package` 추가 (`com.kimitter.app`) — EAS Build 필수 필드

## 사용 방법

```bash
cd frontend

# 1. EAS CLI 설치 (최초 1회)
npm install -g eas-cli

# 2. Expo 로그인
eas login

# 3. APK 빌드
eas build --profile preview --platform android

# 4. 빌드 완료 후 콘솔에 표시되는 URL을 부모님께 공유
#    → 해당 링크 접속 시 APK 다운로드 → 설치
```

## 검증
- `npx tsc --noEmit` (frontend): 에러 0개
