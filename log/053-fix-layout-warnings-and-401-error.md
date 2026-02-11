# 053 - Layout 경고 및 401 Uncaught Promise 에러 수정

**날짜**: 2026-02-11  
**요청**: 실행 시 "[Layout children] No route named" 경고 + 401 AxiosError uncaught promise 수정

---

## 변경 사항

### 1. Layout 경고 수정 (`frontend/app/_layout.tsx`)

**문제**: `Stack.Screen name`이 Expo Router의 실제 children 이름과 불일치
- 경고: `No route named "[postId]"` / `No route named "user"`
- 실제 children: `["(auth)", "(tabs)", "[postId]/index", "user/[userId]"]`

**수정**:
- `name="[postId]"` → `name="[postId]/index"`
- `name="user"` → `name="user/[userId]"`

### 2. 401 Uncaught Promise 수정 (`frontend/src/services/api.ts`)

**문제**: 토큰 갱신(refresh) 실패 시 SecureStore에서 토큰만 삭제하고, authStore의 상태는 로그인 상태로 남아 있음. 이후 요청이 계속 401을 발생시키며 uncaught promise rejection 발생.

**수정**:
- `api.ts`에 `setLogoutCallback` export 추가
- 토큰 갱신 실패 시 USER 키도 함께 삭제 + logoutCallback 호출
- `_layout.tsx`에서 앱 마운트 시 logoutCallback 등록 → authStore 상태 초기화

---

## 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/app/_layout.tsx` | Stack.Screen name 수정 + setLogoutCallback 등록 |
| `frontend/src/services/api.ts` | setLogoutCallback 추가 + refresh 실패 시 USER 삭제 및 logout 콜백 호출 |

---

## 검증

- `npx tsc --noEmit` — 에러 0개
