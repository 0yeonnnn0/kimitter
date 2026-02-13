# Error Toast UI + 탭 진입 시 자동 새로고침

## TL;DR

> **Quick Summary**: API 에러 발생 시 화면 상단에 자동 사라지는 에러 토스트를 표시하고, 검색/프로필 탭 진입 시 글 목록을 자동으로 새로고침하는 두 가지 프론트엔드 개선.
> 
> **Deliverables**:
> - 에러 토스트 컴포넌트 + Zustand 스토어 + Axios 인터셉터 연동
> - 검색/프로필 탭 포커스 시 데이터 자동 리패치
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (Error Store) → Task 2 (Toast Component) → Task 3 (Interceptor + Layout) | Task 4, 5 (Tab Refresh, parallel)

---

## Context

### Original Request
1. "401에러뜨면 뭐 그냥 프론트에서 network 에러든 무슨 에러든 나왔다고 보여주는 UI를 만들어줘"
2. "검색창, 프로필창에 들어갈 때마다 글 목록을 새로고침해줘"

### Interview Summary
**Key Discussions**:
- Error Toast: 모든 API 에러(401, 네트워크, 서버 등)에 대해 화면에 토스트로 표시
- Tab Refresh: 검색 탭과 프로필 탭 진입 시 글 목록 자동 새로고침

**Research Findings**:
- Axios 인터셉터(`api.ts:28-73`)에 두 개의 `Promise.reject` 경로 존재: 401 refresh 실패(line 66) + 기타 에러(line 72)
- `useFocusEffect`는 `expo-router`에서 직접 import 해야 함 (`@react-navigation/native`가 아님)
- `ProfileTabs` 컴포넌트가 `profile.tsx`와 `user/[userId].tsx` 양쪽에서 사용됨 → focus 로직은 `profile.tsx` 스크린에 배치해야 다른 유저 프로필 페이지에 영향 없음
- Zustand 스토어 패턴: `createModalStore.ts` 참고 (간결한 `create<State>` 패턴)
- 프로젝트에 토스트 관련 서드파티 라이브러리 없음 → 자체 구현

### Metis Review
**Identified Gaps** (addressed):
- `useFocusEffect` import 소스 교정: `@react-navigation/native` → `expo-router`
- ProfileTabs 내부가 아닌 `profile.tsx` 스크린에 focus 로직 배치 (user/[userId].tsx 영향 방지)
- 토스트 중복 방지: 여러 에러 동시 발생 시 최신 에러만 표시
- 401 토큰 갱신 중 토스트 미표시: 최종 reject 경로에서만 trigger
- search.tsx의 기존 useEffect를 useFocusEffect로 교체 (이중 fetch 방지)
- 인증 화면(로그인/회원가입)에서의 에러 토스트 중복 표시 가능성 → 수용 (4명 가족 앱, 복잡도 대비 이점 없음)

---

## Work Objectives

### Core Objective
프론트엔드 UX 개선: API 에러 시각적 피드백 + 탭 전환 시 데이터 최신성 보장

### Concrete Deliverables
- `frontend/src/stores/errorStore.ts` — 에러 상태 Zustand 스토어
- `frontend/src/components/ErrorToast.tsx` — 에러 토스트 UI 컴포넌트
- `frontend/src/services/api.ts` — Axios 인터셉터 에러 토스트 연동
- `frontend/app/_layout.tsx` — ErrorToast 글로벌 렌더링
- `frontend/app/(tabs)/search.tsx` — 탭 포커스 시 갤러리 새로고침
- `frontend/app/(tabs)/profile.tsx` — 탭 포커스 시 프로필 글 새로고침
- `frontend/src/components/ProfileTabs.tsx` — refreshTrigger prop 추가

### Definition of Done
- [x] `cd frontend && npx tsc --noEmit` — 0 errors
- [x] `git diff frontend/package.json` — 변경 없음 (새 의존성 추가 금지)
- [x] `grep -r "useFocusEffect" frontend/ --include="*.tsx"` — 모든 import가 `expo-router`에서

### Must Have
- API 에러 시 토스트가 화면 상단에 표시됨
- 토스트가 ~3초 후 자동으로 사라짐
- 정상적인 토큰 갱신 중에는 토스트가 표시되지 않음
- 검색 탭 진입 시 갤러리 데이터 새로고침
- 프로필 탭 진입 시 글 목록 새로고침

### Must NOT Have (Guardrails)
- ❌ 새로운 npm 패키지 추가 (react-native-toast 등)
- ❌ 개별 컴포넌트의 catch 블록에 토스트 호출 추가
- ❌ 홈 피드, 활동 탭에 focus refresh 추가
- ❌ `user/[userId].tsx`에 focus refresh 영향
- ❌ 토큰 갱신 시도 중(401 초기 감지 시) 토스트 표시
- ❌ 토스트 큐/스택 — 최신 에러 하나만 표시
- ❌ success/info/warning 등 다중 토스트 타입
- ❌ 토스트에 retry 버튼
- ❌ `react-native-reanimated` 사용 — `Animated` from `react-native`만 사용
- ❌ focus refresh 시 로딩 스피너 표시 — 사일런트 백그라운드 리패치
- ❌ `@react-navigation/native`에서 `useFocusEffect` import

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Jest)
- **Automated tests**: NO (UI 컴포넌트 + 인터셉터 수정 — 수동 검증보다 타입체크 + Agent QA가 효과적)
- **Framework**: Jest (기존)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Type Check** | Bash (`npx tsc --noEmit`) | 0 errors 확인 |
| **Import 검증** | Bash (`grep`) | useFocusEffect import 소스 확인 |
| **의존성 검증** | Bash (`git diff`) | package.json 변경 없음 확인 |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — parallel):
├── Task 1: errorStore.ts 생성
├── Task 4: search.tsx useFocusEffect 추가
└── Task 5: profile.tsx + ProfileTabs.tsx refreshTrigger 추가

Wave 2 (After Task 1):
├── Task 2: ErrorToast.tsx 생성 (depends: Task 1)
└── Task 3: api.ts 인터셉터 연동 + _layout.tsx 렌더링 (depends: Task 1, 2)

Wave 3 (After all):
└── Task 6: 타입 체크 + 커밋

Critical Path: Task 1 → Task 2 → Task 3 → Task 6
Parallel Speedup: Task 4, 5 run alongside Task 1
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | 4, 5 |
| 2 | 1 | 3 | 4, 5 |
| 3 | 1, 2 | 6 | 4, 5 |
| 4 | None | 6 | 1, 2, 3, 5 |
| 5 | None | 6 | 1, 2, 3, 4 |
| 6 | 1, 2, 3, 4, 5 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 4, 5 | `task(category="quick", load_skills=[], run_in_background=false)` — parallel group |
| 2 | 2, 3 | `task(category="quick", load_skills=[], run_in_background=false)` |
| 3 | 6 | `task(category="quick", load_skills=[], run_in_background=false)` — verification only |

---

## TODOs

- [x] 1. errorStore.ts — 에러 상태 Zustand 스토어 생성

  **What to do**:
  - `frontend/src/stores/errorStore.ts` 생성
  - State: `{ message: string; visible: boolean }`
  - Actions: `show(message: string)` — visible=true + message 설정, `hide()` — visible=false
  - `show()` 호출 시 기존 에러를 덮어씀 (큐 아님, 최신 에러만)
  - Zustand `create<State>((set) => ({ ... }))` 패턴 사용

  **Must NOT do**:
  - 토스트 큐/스택 구현
  - 타이머 로직 (타이머는 컴포넌트에서 관리)
  - 에러 타입별 분류 (severity 등)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일 생성, 14줄 이내, 기존 패턴 복사 수준
  - **Skills**: `[]`
    - 특별한 스킬 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 4, 5)
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `frontend/src/stores/createModalStore.ts:1-13` — Zustand 스토어 구조 패턴. `create<State>((set) => ({ ... }))` 형태 그대로 따를 것. `visible`, `open()`, `close()` 패턴을 `visible`, `message`, `show(msg)`, `hide()` 패턴으로 확장

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: errorStore.ts 파일 생성 확인
    Tool: Bash (cat/grep)
    Steps:
      1. cat frontend/src/stores/errorStore.ts
      2. Assert: 파일이 존재하고 `create<` 패턴 포함
      3. Assert: `useErrorStore` named export 존재
      4. Assert: `show` 함수와 `hide` 함수 존재
      5. Assert: `message: string` 과 `visible: boolean` 상태 존재
    Expected Result: Zustand 스토어가 올바른 패턴으로 생성됨
  ```

  **Commit**: YES (groups with Task 2, 3)
  - Message: `feat(frontend): 에러 토스트 UI 추가 — Zustand 스토어, 토스트 컴포넌트, Axios 인터셉터 연동`
  - Files: `frontend/src/stores/errorStore.ts`, `frontend/src/components/ErrorToast.tsx`, `frontend/src/services/api.ts`, `frontend/app/_layout.tsx`

---

- [x] 2. ErrorToast.tsx — 에러 토스트 UI 컴포넌트 생성

  **What to do**:
  - `frontend/src/components/ErrorToast.tsx` 생성
  - `useErrorStore`에서 `visible`, `message`, `hide` 구독
  - `visible`이 true가 되면:
    - `Animated` (from `react-native`)로 화면 상단에서 슬라이드 인
    - 3초 후 자동 `hide()` 호출 (setTimeout)
    - 타이머는 visible 변경 시 리셋 (이전 타이머 clearTimeout)
  - 스타일: 화면 상단, SafeArea 아래, 검정 배경(`#1a1a1a`), 흰색 텍스트, 둥근 모서리
  - 텍스트: `message` 그대로 표시
  - `visible=false`일 때 아무것도 렌더링하지 않음 (또는 opacity 0으로 숨김)

  **Must NOT do**:
  - `react-native-reanimated` 사용
  - 서드파티 토스트 라이브러리 사용
  - retry 버튼 추가
  - 닫기(X) 버튼 추가 — 자동 사라짐만
  - 에러 타입별 색상 분기

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 컴포넌트 생성, Animated 기본 사용
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/stores/errorStore.ts` (Task 1에서 생성) — `useErrorStore` import 대상
  - `frontend/src/components/CreatePostModal.tsx` — 컴포넌트 구조 패턴 참고 (import 순서, StyleSheet 사용법)

  **API/Type References**:
  - React Native `Animated` API — `Animated.Value`, `Animated.timing`, `Animated.View`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: ErrorToast.tsx 파일 생성 확인
    Tool: Bash (cat/grep)
    Steps:
      1. cat frontend/src/components/ErrorToast.tsx
      2. Assert: 파일 존재하고 `useErrorStore` import 포함
      3. Assert: `Animated` from 'react-native' import 포함
      4. Assert: `setTimeout` 또는 타이머 로직 존재
      5. Assert: StyleSheet 정의에 `backgroundColor` 포함
    Expected Result: 토스트 컴포넌트가 올바르게 구현됨

  Scenario: 서드파티 의존성 미사용 확인
    Tool: Bash (grep)
    Steps:
      1. grep -r "react-native-reanimated\|react-native-toast\|react-native-flash-message" frontend/src/components/ErrorToast.tsx
      2. Assert: 일치 결과 없음 (exit code 1)
    Expected Result: 서드파티 토스트/애니메이션 라이브러리 미사용
  ```

  **Commit**: YES (groups with Task 1, 3)
  - Message: (Task 1과 동일 커밋)

---

- [x] 3. Axios 인터셉터 연동 + _layout.tsx 글로벌 렌더링

  **What to do**:

  **api.ts 수정**:
  - `useErrorStore`를 import: `import { useErrorStore } from '../stores/errorStore';`
  - 401 refresh 실패 경로 (현재 line 66 `return Promise.reject(error)` 직전):
    ```typescript
    useErrorStore.getState().show('세션이 만료되었습니다.');
    ```
  - 기타 에러 경로 (현재 line 72 `return Promise.reject(error)` 직전):
    ```typescript
    const message = (error.response?.data as { error?: string })?.error
      || (error.message === 'Network Error' ? '네트워크 오류가 발생했습니다.' : '오류가 발생했습니다.');
    useErrorStore.getState().show(message);
    ```
  - **주의**: `useErrorStore.getState().show()` 사용 (React 외부에서 Zustand 접근)
  - **주의**: line 33 (초기 401 감지)에는 토스트 추가 금지 — 여기는 정상 토큰 갱신 시작점

  **_layout.tsx 수정**:
  - `ErrorToast` import 추가
  - `<Stack>` 다음에 `<ErrorToast />` 렌더링 (z-index를 위해 `<Stack>` 뒤에 배치)
  - `<>...</>` fragment 안에 추가

  **Must NOT do**:
  - 개별 서비스 파일(postService, authService 등)의 catch 블록 수정
  - `error.config._retry` 체크 직후 (line 33-34)에 토스트 추가
  - `logoutCallback()` 호출 로직 변경

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 파일 2개 수정, 각 5-10줄 추가
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 2)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `frontend/src/services/api.ts:28-73` — 현재 Axios 응답 인터셉터 전체. 수정 대상 line 66 (`return Promise.reject(error)` in catch block)과 line 72 (`return Promise.reject(error)` 최종)
  - `frontend/src/services/api.ts:61-66` — 401 refresh 실패 시 토큰 삭제 + logoutCallback 호출 흐름. 이 catch 블록의 `return Promise.reject(error)` 직전에 토스트 trigger
  - `frontend/src/services/api.ts:72` — 기타 모든 에러의 최종 reject 경로. 여기 직전에 토스트 trigger
  - `frontend/app/_layout.tsx:34-45` — 현재 return JSX. `<Stack>` 다음, `</>` 직전에 `<ErrorToast />` 추가

  **API/Type References**:
  - `frontend/src/stores/errorStore.ts` (Task 1에서 생성) — `useErrorStore.getState().show(message)` 호출 패턴

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: api.ts 인터셉터에 에러 토스트 연동 확인
    Tool: Bash (grep)
    Steps:
      1. grep "useErrorStore" frontend/src/services/api.ts
      2. Assert: import 문과 .getState().show() 호출이 존재
      3. grep -n "getState().show" frontend/src/services/api.ts
      4. Assert: 최소 2곳에서 호출 (401 실패 경로 + 기타 에러 경로)
    Expected Result: 인터셉터의 두 reject 경로 모두에 토스트 연동됨

  Scenario: _layout.tsx에 ErrorToast 렌더링 확인
    Tool: Bash (grep)
    Steps:
      1. grep "ErrorToast" frontend/app/_layout.tsx
      2. Assert: import 문과 <ErrorToast /> JSX 모두 존재
    Expected Result: 글로벌 에러 토스트가 루트 레이아웃에 렌더링됨

  Scenario: 초기 401 감지 경로에 토스트 없음 확인
    Tool: Bash (analysis)
    Steps:
      1. cat frontend/src/services/api.ts
      2. Assert: line 33 부근 (error.response?.status === 401 && !originalRequest._retry) 블록 내부에 show() 호출 없음
      3. show() 호출은 catch 블록(refresh 실패)과 최하단 reject에만 존재
    Expected Result: 정상 토큰 갱신 중 토스트 미발생
  ```

  **Commit**: YES (groups with Task 1, 2)
  - Message: `feat(frontend): 에러 토스트 UI 추가 — Zustand 스토어, 토스트 컴포넌트, Axios 인터셉터 연동`
  - Files: `frontend/src/stores/errorStore.ts`, `frontend/src/components/ErrorToast.tsx`, `frontend/src/services/api.ts`, `frontend/app/_layout.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 4. search.tsx — 탭 포커스 시 갤러리 자동 새로고침

  **What to do**:
  - `useFocusEffect`를 `expo-router`에서 import: `import { useFocusEffect } from 'expo-router';`
  - `useCallback`은 이미 import되어 있음 (line 1)
  - **기존 `useEffect` 교체** (line 107-109):
    ```typescript
    // 삭제:
    useEffect(() => {
      loadAllPosts();
    }, [loadAllPosts]);

    // 추가:
    useFocusEffect(
      useCallback(() => {
        loadAllPosts();
      }, [loadAllPosts])
    );
    ```
  - 이렇게 하면 최초 마운트 + 탭 재진입 시 모두 `loadAllPosts()` 호출
  - 기존 `useEffect`를 제거하므로 이중 fetch 방지

  **Must NOT do**:
  - 기존 `useEffect`를 남겨둔 채 `useFocusEffect` 추가 (이중 fetch 발생)
  - `@react-navigation/native`에서 import
  - 로딩 스피너 추가/변경 — 기존 `galleryLoading` 로직 그대로 유지
  - `handleRefresh` 수정 (pull-to-refresh는 기존 그대로)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, import 1줄 + useEffect→useFocusEffect 교체
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 5)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/app/(tabs)/search.tsx:107-109` — 교체 대상 `useEffect`. `loadAllPosts` 호출하는 현재 코드
  - `frontend/app/(tabs)/search.tsx:81-90` — `loadAllPosts` 함수 정의. `useCallback`으로 감싸져 있으므로 `useFocusEffect` 의존성으로 전달 가능
  - `frontend/app/(tabs)/search.tsx:1` — 현재 import 라인. `useEffect`를 제거하지 않아도 됨 (다른 곳에서 사용하지 않는지 확인 필요 — 실제로 이 파일에서 `useEffect`는 line 107에서만 사용됨, 제거 가능하지만 다른 곳에서도 필요할 수 있으니 남겨둬도 무방)

  **External References**:
  - expo-router `useFocusEffect`: React Navigation의 `useFocusEffect`와 동일 API. 콜백은 `useCallback`으로 감싸야 함.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: useFocusEffect가 expo-router에서 import됨
    Tool: Bash (grep)
    Steps:
      1. grep "useFocusEffect" frontend/app/(tabs)/search.tsx
      2. Assert: import 문이 'expo-router'에서 가져옴
      3. Assert: '@react-navigation/native' import 없음
    Expected Result: expo-router에서 올바르게 import

  Scenario: 기존 useEffect 교체 확인
    Tool: Bash (grep)
    Steps:
      1. grep -n "useEffect.*loadAllPosts\|useFocusEffect" frontend/app/(tabs)/search.tsx
      2. Assert: `useFocusEffect` 호출 존재
      3. Assert: 기존 `useEffect(() => { loadAllPosts() }, [loadAllPosts])` 패턴 없음
    Expected Result: useEffect가 useFocusEffect로 교체됨
  ```

  **Commit**: YES (groups with Task 5)
  - Message: `feat(frontend): 검색/프로필 탭 진입 시 글 목록 자동 새로고침`
  - Files: `frontend/app/(tabs)/search.tsx`, `frontend/app/(tabs)/profile.tsx`, `frontend/src/components/ProfileTabs.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 5. profile.tsx + ProfileTabs.tsx — 프로필 탭 포커스 시 자동 새로고침

  **What to do**:

  **profile.tsx 수정**:
  - `useFocusEffect`를 `expo-router`에서 import
  - `useState`, `useCallback`을 import에 추가
  - `refreshTrigger` state 추가: `const [refreshTrigger, setRefreshTrigger] = useState(0);`
  - `useFocusEffect` 추가:
    ```typescript
    useFocusEffect(
      useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, [])
    );
    ```
  - `<ProfileTabs>` 에 prop 전달: `<ProfileTabs userId={user.id} headerComponent={profileHeader} refreshTrigger={refreshTrigger} />`

  **ProfileTabs.tsx 수정**:
  - `ProfileTabsProps` interface에 `refreshTrigger?: number` 추가
  - 컴포넌트 파라미터에서 `refreshTrigger` 구조분해
  - `useEffect` 추가:
    ```typescript
    useEffect(() => {
      if (refreshTrigger !== undefined && refreshTrigger > 0) {
        fetchTabData(activeTab);
      }
    }, [refreshTrigger]);
    ```
  - 이렇게 하면 profile.tsx에서 탭 포커스 → refreshTrigger 증가 → ProfileTabs가 감지하여 리패치
  - `user/[userId].tsx`에서는 `refreshTrigger` prop을 전달하지 않으므로 영향 없음

  **Must NOT do**:
  - `ProfileTabs.tsx` 내부에 `useFocusEffect` 추가 (user/[userId].tsx에 영향)
  - `user/[userId].tsx` 수정
  - 기존 `useEffect(() => { fetchTabData(activeTab); }, [activeTab, fetchTabData])` 제거 (탭 전환 시 데이터 로드에 필요)
  - 로딩 스피너 추가/변경

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 파일 2개 수정, 각 5-10줄 추가
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/app/(tabs)/profile.tsx:1` — 현재 import (useState만 있음, useCallback 추가 필요)
  - `frontend/app/(tabs)/profile.tsx:111` — `<ProfileTabs userId={user.id} headerComponent={profileHeader} />` — refreshTrigger prop 추가 위치
  - `frontend/src/components/ProfileTabs.tsx:19-22` — `ProfileTabsProps` interface 정의 — `refreshTrigger?: number` 추가 위치
  - `frontend/src/components/ProfileTabs.tsx:24` — 컴포넌트 파라미터 구조분해 — `refreshTrigger` 추가
  - `frontend/src/components/ProfileTabs.tsx:37-55` — `fetchTabData` 함수 — refreshTrigger의 useEffect에서 호출 대상
  - `frontend/src/components/ProfileTabs.tsx:57-59` — 기존 `useEffect` (activeTab 변경 감지) — 이것은 유지, 별도로 refreshTrigger useEffect 추가

  **검증 대상 (영향 없어야 함)**:
  - `frontend/app/user/[userId].tsx` — ProfileTabs를 사용하지만 refreshTrigger prop 미전달이므로 영향 없음

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: profile.tsx에 useFocusEffect + refreshTrigger 추가 확인
    Tool: Bash (grep)
    Steps:
      1. grep "useFocusEffect" frontend/app/(tabs)/profile.tsx
      2. Assert: 'expo-router'에서 import
      3. grep "refreshTrigger" frontend/app/(tabs)/profile.tsx
      4. Assert: useState, setRefreshTrigger, ProfileTabs prop 전달 모두 존재
    Expected Result: 프로필 스크린에 focus refresh 로직 추가됨

  Scenario: ProfileTabs.tsx에 refreshTrigger prop 추가 확인
    Tool: Bash (grep)
    Steps:
      1. grep "refreshTrigger" frontend/src/components/ProfileTabs.tsx
      2. Assert: interface에 `refreshTrigger?: number` 존재
      3. Assert: useEffect에서 refreshTrigger 감지 존재
    Expected Result: ProfileTabs가 refreshTrigger prop을 받아 리패치함

  Scenario: user/[userId].tsx 미변경 확인
    Tool: Bash (grep)
    Steps:
      1. grep "refreshTrigger" frontend/app/user/\[userId\].tsx
      2. Assert: 일치 없음 (exit code 1)
    Expected Result: 다른 유저 프로필 페이지에 영향 없음
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(frontend): 검색/프로필 탭 진입 시 글 목록 자동 새로고침`
  - Files: (Task 4와 동일 커밋)

---

- [x] 6. 타입 체크 + 로그 생성 + 커밋

  **What to do**:
  - `cd frontend && npx tsc --noEmit` 실행 → 0 errors 확인
  - `git diff frontend/package.json` → 변경 없음 확인
  - `log/080-error-toast-and-tab-refresh.md` 변경 로그 생성
  - 커밋 2개 생성 (AGENTS.md 규칙: 한 번의 답변 = 하나의 커밋 → 기능별 분리):
    1. Error Toast: `feat(frontend): 에러 토스트 UI 추가 — Zustand 스토어, 토스트 컴포넌트, Axios 인터셉터 연동`
    2. Tab Refresh: `feat(frontend): 검색/프로필 탭 진입 시 글 목록 자동 새로고침`
  - 또는 하나의 커밋으로 합칠 수도 있음 (사용자 선호에 따라)

  **Must NOT do**:
  - 타입 에러가 있는 상태로 커밋
  - package.json 변경이 있는 상태로 커밋

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 검증 + 커밋 작업
  - **Skills**: `['git-master']`
    - `git-master`: 커밋 생성 및 로그 파일 작성

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None
  - **Blocked By**: Task 1, 2, 3, 4, 5

  **References**:

  **Pattern References**:
  - `log/079-nas-docker-deployment-fix.md` — 변경 로그 파일 형식 참고
  - AGENTS.md — "모든 질문에 대한 답변은 하나의 커밋으로 저장한다" + "/log 폴더를 만들어서 한 번의 답변에 대한 수정사항들을 전부 하나의 md 파일을 생성해서 기록한다"

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 타입 체크 통과
    Tool: Bash
    Steps:
      1. cd frontend && npx tsc --noEmit
      2. Assert: exit code 0, 에러 출력 없음
    Expected Result: TypeScript 컴파일 에러 0개

  Scenario: 새 의존성 미추가 확인
    Tool: Bash
    Steps:
      1. git diff frontend/package.json
      2. Assert: 출력 없음 (변경 없음)
    Expected Result: package.json 변경 없음

  Scenario: 커밋 성공 확인
    Tool: Bash
    Steps:
      1. git log --oneline -2
      2. Assert: 최근 커밋에 에러 토스트 또는 탭 새로고침 관련 메시지 존재
    Expected Result: 커밋이 올바르게 생성됨
  ```

  **Commit**: This IS the commit task

---

## Commit Strategy

| After Task(s) | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1, 2, 3 | `feat(frontend): 에러 토스트 UI 추가 — Zustand 스토어, 토스트 컴포넌트, Axios 인터셉터 연동` | errorStore.ts, ErrorToast.tsx, api.ts, _layout.tsx | `npx tsc --noEmit` |
| 4, 5 | `feat(frontend): 검색/프로필 탭 진입 시 글 목록 자동 새로고침` | search.tsx, profile.tsx, ProfileTabs.tsx | `npx tsc --noEmit` |
| 6 | `docs: 에러 토스트 및 탭 새로고침 변경 로그 추가` | log/080-error-toast-and-tab-refresh.md | — |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npx tsc --noEmit  # Expected: 0 errors
git diff frontend/package.json   # Expected: no output (no changes)
grep -r "useFocusEffect" frontend/app/ frontend/src/ --include="*.tsx" --include="*.ts"
# Expected: all imports from 'expo-router'
```

### Final Checklist
- [x] errorStore.ts 생성 완료 (message, visible, show, hide)
- [x] ErrorToast.tsx 생성 완료 (Animated, 3초 auto-dismiss, 상단 표시)
- [x] api.ts 인터셉터 연동 (두 reject 경로에서 show 호출)
- [x] _layout.tsx에 ErrorToast 글로벌 렌더링
- [x] search.tsx useEffect → useFocusEffect 교체
- [x] profile.tsx useFocusEffect + refreshTrigger 추가
- [x] ProfileTabs.tsx refreshTrigger prop 수용
- [x] user/[userId].tsx 변경 없음
- [x] npx tsc --noEmit 통과
- [x] package.json 변경 없음
- [x] 로그 파일 생성 완료
- [x] 커밋 완료
