# 082 - EAS Update(OTA) 설정 및 기타 수정사항

**날짜**: 2025-02-12  
**작업 유형**: 인프라 설정, UI 개선, 문서 업데이트

---

## 변경사항 요약

### 1. EAS Update (OTA) 설정
APK 재설치 없이 JS 변경사항을 OTA(Over-The-Air)로 배포할 수 있도록 `expo-updates`를 설정했습니다.

**수정 파일**:
- `frontend/app.json`: `updates.url`, `runtimeVersion.policy`, `expo-updates` 플러그인 추가
- `frontend/eas.json`: 각 빌드 프로필에 `channel` 추가 (development, preview, production)
- `frontend/package.json`, `frontend/package-lock.json`: `expo-updates` 패키지 설치

**설정 상세**:
- Update URL: `https://u.expo.dev/dca62b82-227d-4d59-80cc-5e952938fa9c`
- Runtime Version Policy: `appVersion` (앱 버전 기준 호환성 관리)
- Channels: development, preview, production

**OTA 업데이트 사용법**:
```bash
cd frontend && eas update --branch preview --message "수정 내용 설명"
```

### 2. FlatList contentContainerStyle 개선
빈 목록일 때 FlatList가 올바르게 확장되도록 `contentContainerStyle={{ flexGrow: 1 }}` 추가.

**수정 파일**:
- `frontend/app/(tabs)/index.tsx`: 홈 피드 FlatList
- `frontend/app/[postId]/index.tsx`: 게시글 상세 댓글 FlatList

### 3. Docker Hub 배포 로그 업데이트
Task 3 (Docker Hub push) 완료 기록 및 최종 상태 업데이트.

**수정 파일**:
- `log/077-docker-hub-deploy.md`: Task 3 실행 결과, 최종 검증 체크리스트, Synology 배포 가이드 추가

---

## 다음 단계

1. APK 재빌드: `cd frontend && eas build --profile preview --platform android --non-interactive`
2. 가족에게 새 APK 배포 (이번이 마지막 수동 설치)
3. 이후 JS 변경은 `eas update`로 OTA 배포 가능

---

**Generated**: 2025-02-12 by Sisyphus
