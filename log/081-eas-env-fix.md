# 081 - EAS Build 환경변수 수정

## 문제
- EAS 클라우드 빌드 시 `.env` 파일이 `.gitignore`에 포함되어 업로드되지 않음
- APK에서 `EXPO_PUBLIC_API_URL`이 fallback인 `http://localhost:3000/api`로 설정됨
- 실제 기기에서 localhost 접근 불가 → Network Error 발생

## 해결
- `frontend/eas.json`의 `preview` 프로필에 `env` 블록 추가
- `EXPO_PUBLIC_API_URL: "https://kimitter.yeonnnn.xyz/api"` 직접 설정
- EAS 빌드 시 환경변수가 올바르게 주입됨

## 변경 파일
- `frontend/eas.json` — preview 프로필에 env 블록 추가
