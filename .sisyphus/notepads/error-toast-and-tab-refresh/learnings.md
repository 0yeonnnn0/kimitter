# Learnings & Conventions

> Accumulated knowledge from task execution. Patterns, conventions, gotchas discovered during implementation.

---
## errorStore 패턴

- Zustand `create<State>((set) => ({ ... }))` 패턴 사용
- `createModalStore.ts`와 동일한 구조: State interface + actions
- State: `{ message: string; visible: boolean }`
- Actions: `show(message)` (visible=true + message 설정), `hide()` (visible=false)
- Named export: `useErrorStore`
- 단일 에러만 표시 (큐/스택 아님) — `show()` 호출 시 기존 에러 덮어씀

## useFocusEffect Import Source
- **CORRECT**: `import { useFocusEffect } from 'expo-router';`
- **WRONG**: `import { useFocusEffect } from '@react-navigation/native';`
- useFocusEffect is provided by expo-router, NOT @react-navigation/native
- This hook triggers when a tab/screen comes into focus, perfect for auto-refresh on tab switch

## ErrorToast Component Pattern

- **File**: `frontend/src/components/ErrorToast.tsx`
- **Animation**: `Animated` from `react-native` (NOT `react-native-reanimated`)
- **Auto-dismiss**: 3-second `setTimeout` with `clearTimeout` cleanup in useEffect return
- **Timer reset**: On `visible` change, clear existing timer before setting new one
- **Styling**: 
  - Position: `absolute`, `top: insets.top + 8` (SafeArea-aware)
  - Background: `#1a1a1a`, text: `#fff`
  - Border radius: `12`, padding: `16`
  - Horizontal margins: `left: 16`, `right: 16`
- **Render**: Returns `null` when `visible=false` (no render overhead)
- **Animation values**: Slide from `-100` (off-screen) to `0` (visible), 300ms duration
- **useRef pattern**: `timerRef` for persistent timer ID across renders, `slideAnim` for Animated.Value

## ErrorToast Component Implementation ✓

**Status**: COMPLETED

**File**: `frontend/src/components/ErrorToast.tsx`

**Verification Checklist**:
- ✅ File exists at correct path
- ✅ Imports: `useErrorStore`, `Animated` from `react-native`, `useSafeAreaInsets`
- ✅ Animation: Slide in from top (translateY: -100 → 0), 300ms duration
- ✅ Auto-dismiss: 3-second setTimeout with clearTimeout cleanup
- ✅ Timer reset: Clears existing timer before setting new one on visible change
- ✅ Styling: #1a1a1a background, #fff text, 12px border radius, 16px padding
- ✅ SafeArea-aware positioning: `top: insets.top + 8`
- ✅ Render: Returns null when visible=false
- ✅ useRef pattern: timerRef for persistent timer ID, slideAnim for Animated.Value
- ✅ No third-party toast libraries (react-native-reanimated, react-native-toast, etc.)
- ✅ Integrated in `frontend/app/_layout.tsx`
- ✅ TypeScript: No errors (npx tsc --noEmit passes)

**Key Implementation Details**:
- Timer cleanup in useEffect return prevents memory leaks
- Animated.timing with useNativeDriver=true for smooth 60fps animation
- Slide out animation on hide() call (toValue: -100)
- Horizontal margins: left: 16, right: 16 (via container styles)
- zIndex: 999 ensures toast appears above all content
# Task 3: Axios 인터셉터 연동 — 에러 토스트 trigger 추가

## 완료 상태
✅ **COMPLETED** - 모든 요구사항 충족

## 구현 내용

### 1. useErrorStore 임포트
```typescript
import { useErrorStore } from '../stores/errorStore';
```
- Line 4에 추가됨
- Zustand store에서 getState() 패턴으로 React 외부에서 접근

### 2. 401 토큰 갱신 실패 경로 (Line 67)
```typescript
catch {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
  if (logoutCallback) logoutCallback();
  useErrorStore.getState().show('세션이 만료되었습니다.');
  return Promise.reject(error);
}
```
- 토큰 갱신 실패 시 사용자에게 명확한 메시지 표시
- 로그아웃 콜백 실행 후 토스트 표시

### 3. 기타 에러 경로 (Line 74-76)
```typescript
const errorMessage = (error.response?.data as { error?: string })?.error
  || (error.message === 'Network Error' ? '네트워크 오류가 발생했습니다.' : '오류가 발생했습니다.');
useErrorStore.getState().show(errorMessage);
return Promise.reject(error);
```
- 서버 응답 에러 메시지 우선 사용
- 네트워크 에러 시 특정 메시지 표시
- 기타 에러는 기본 메시지 표시

### 4. 초기 401 감지 (Line 34) - 토스트 없음
```typescript
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  // ... 토큰 갱신 로직
}
```
- 초기 401 감지 시 토스트 표시 안 함
- 정상적인 토큰 갱신 프로세스 시작점이므로 사용자에게 알림 불필요

## 검증 결과

| 항목 | 결과 |
|------|------|
| useErrorStore import | ✅ Line 4 |
| 401 refresh 실패 토스트 | ✅ Line 67 |
| 기타 에러 토스트 | ✅ Line 76 |
| 초기 401 감지 토스트 없음 | ✅ 확인됨 |
| getState().show() 호출 수 | ✅ 2개 |
| TypeScript 타입 검사 | ✅ 통과 |

## 패턴 정리

### Zustand 외부 접근 패턴
```typescript
// React 컴포넌트 내부
const { show } = useErrorStore();
show('message');

// React 외부 (Axios 인터셉터, 서비스 등)
useErrorStore.getState().show('message');
```

### 에러 메시지 우선순위
1. 서버 응답 에러 메시지 (`error.response?.data?.error`)
2. 네트워크 에러 감지 (`error.message === 'Network Error'`)
3. 기본 에러 메시지

## 관련 파일
- `frontend/src/services/api.ts` - Axios 인터셉터 설정
- `frontend/src/stores/errorStore.ts` - 에러 토스트 상태 관리
