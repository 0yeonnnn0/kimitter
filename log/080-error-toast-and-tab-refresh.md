# 080 - 에러 토스트 UI + 탭 진입 시 자동 새로고침

## 변경 사항

### 에러 토스트 UI
- `frontend/src/stores/errorStore.ts` — 에러 상태 Zustand 스토어 (message, visible, show, hide)
- `frontend/src/components/ErrorToast.tsx` — 에러 토스트 컴포넌트 (Animated 슬라이드 인, 3초 자동 사라짐)
- `frontend/src/services/api.ts` — Axios 인터셉터에 에러 토스트 연동 (401 실패 + 기타 에러)
- `frontend/app/_layout.tsx` — ErrorToast 글로벌 렌더링

### 탭 진입 시 자동 새로고침
- `frontend/app/(tabs)/search.tsx` — useFocusEffect로 교체 (탭 포커스 시 갤러리 데이터 리패치)
- `frontend/app/(tabs)/profile.tsx` — useFocusEffect + refreshTrigger (탭 포커스 시 프로필 글 리패치)
- `frontend/src/components/ProfileTabs.tsx` — refreshTrigger prop 추가

## 기술 결정
- useFocusEffect는 expo-router에서 import (NOT @react-navigation/native)
- 에러 토스트는 Animated from react-native 사용 (NOT react-native-reanimated)
- profile focus 로직은 profile.tsx 스크린에 배치 (user/[userId].tsx 영향 방지)
- useErrorStore.getState().show() — React 외부에서 Zustand 접근 패턴
