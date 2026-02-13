# Error Toast & Tab Refresh

**Date**: 2026-02-13
**Session**: 080

---

## Summary
에러 토스트 UI 시스템과 검색/프로필 탭 자동 새로고침 기능을 구현하여 사용자 경험을 개선합니다. Zustand 스토어 기반 에러 상태 관리 및 Axios 인터셉터 연동으로 전역 에러 처리를 통합합니다.

## Changed Files

### Commit 1: Error Toast UI System

#### 1. frontend/src/stores/errorStore.ts (신규)
- **Change**: Zustand 기반 에러 상태 관리 스토어 추가
- **Reason**: 전역 에러 상태를 중앙화하여 어디서나 접근 가능하게 함
- **Details**:
  - `showError(message: string)` 메서드로 에러 토스트 표시
  - `clearError()` 메서드로 에러 상태 초기화
  - 자동 타임아웃 (3초 후 자동 닫힘)

#### 2. frontend/src/components/ErrorToast.tsx (신규)
- **Change**: 에러 토스트 UI 컴포넌트 추가
- **Reason**: 화면 상단에 에러 메시지를 시각적으로 표시
- **Details**:
  - errorStore 구독하여 에러 상태 감지
  - 슬라이드 다운 애니메이션
  - 자동 닫힘 또는 수동 닫기 버튼

#### 3. frontend/src/services/api.ts (수정)
- **Change**: Axios 응답 인터셉터에 에러 토스트 연동
- **Reason**: API 에러 발생 시 자동으로 토스트 표시
- **Details**:
  - 401 에러: 토큰 자동 갱신 시도
  - 4xx/5xx 에러: errorStore.showError() 호출
  - 네트워크 에러: 일반 에러 메시지 표시

#### 4. frontend/app/_layout.tsx (수정)
- **Change**: 루트 레이아웃에 ErrorToast 컴포넌트 추가
- **Reason**: 앱 전체에서 에러 토스트가 표시되도록 함
- **Details**:
  - ErrorToast를 SafeAreaView 상단에 배치
  - 모든 화면에서 접근 가능

### Commit 2: Tab Auto-Refresh on Focus

#### 1. frontend/app/(tabs)/search.tsx (수정)
- **Change**: useFocusEffect 훅으로 탭 진입 시 글 목록 새로고침
- **Reason**: 검색 탭 진입 시 최신 데이터 표시
- **Details**:
  - feedStore.fetchPosts() 호출
  - 로딩 상태 표시

#### 2. frontend/app/(tabs)/profile.tsx (수정)
- **Change**: useFocusEffect 훅으로 탭 진입 시 프로필 글 목록 새로고침
- **Reason**: 프로필 탭 진입 시 최신 게시물 표시
- **Details**:
  - userStore.fetchUserPosts() 호출
  - 로딩 상태 표시

#### 3. frontend/src/components/ProfileTabs.tsx (수정)
- **Change**: 탭 전환 시 해당 탭의 글 목록 새로고침
- **Reason**: 스레드/답글/미디어 탭 전환 시 최신 데이터 표시
- **Details**:
  - 각 탭 선택 시 해당 데이터 페칭
  - 로딩 상태 관리

## Verification

### Type Check
```bash
cd frontend && npx tsc --noEmit
# Result: 0 errors ✓
```

### Package.json Verification
```bash
git diff frontend/package.json
# Result: no changes ✓
```

### Commits Created
```bash
git log --oneline -2
# 1. feat(frontend): 에러 토스트 UI 추가 — Zustand 스토어, 토스트 컴포넌트, Axios 인터셉터 연동
# 2. feat(frontend): 검색/프로필 탭 진입 시 글 목록 자동 새로고침
```

## Implementation Details

### Error Toast Flow
1. API 호출 실패 → Axios 인터셉터 감지
2. errorStore.showError(message) 호출
3. ErrorToast 컴포넌트가 상태 변화 감지
4. 토스트 UI 표시 (슬라이드 다운)
5. 3초 후 자동 닫힘 또는 사용자 수동 닫기

### Tab Refresh Flow
1. 사용자가 탭 진입
2. useFocusEffect 훅 실행
3. feedStore/userStore의 fetch 메서드 호출
4. 로딩 상태 표시
5. 데이터 로드 완료 후 UI 업데이트

## Technical Decisions
- useFocusEffect는 expo-router에서 import (NOT @react-navigation/native)
- 에러 토스트는 Animated from react-native 사용 (NOT react-native-reanimated)
- profile focus 로직은 profile.tsx 스크린에 배치 (user/[userId].tsx 영향 방지)
- useErrorStore.getState().show() — React 외부에서 Zustand 접근 패턴

## Testing Notes
- 에러 토스트: API 에러 발생 시 화면 상단에 메시지 표시 확인
- 탭 새로고침: 각 탭 진입 시 글 목록이 최신 데이터로 업데이트되는지 확인
- 자동 닫힘: 토스트가 3초 후 자동으로 닫히는지 확인
