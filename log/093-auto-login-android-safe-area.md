# 093 — 자동 로그인 + Android 하단 safe area 수정

**날짜**: 2026-02-21

## 변경 사항

### 1. 자동 로그인 (`authStore.ts`)

#### 문제
- `restoreSession`이 만료된 access token(1h)만 확인
- access token 만료 후 앱 재시작 시 로그인 상태 복원 실패

#### 수정
- refresh token(7d) 기반으로 세션 복원
- 앱 시작 시 refresh token으로 새 access token 선제 발급
- 네트워크 오류 시 캐시된 access token으로 fallback (오프라인 대응)
- refresh token도 만료된 경우에만 로그아웃

#### 흐름
1. SecureStore에서 refresh token + user 정보 확인
2. refresh token으로 `/auth/refresh` 호출 → 새 access token 발급
3. 성공 → 로그인 유지 (새 토큰 저장)
4. 실패 (네트워크) → 캐시된 access token으로 fallback
5. 실패 (401) → 세션 만료, 로그아웃

### 2. Android 하단 safe area (`(tabs)/_layout.tsx`)

#### 문제
- `edgeToEdgeEnabled: true` 상태에서 수동 padding 계산이 부정확
- Android 3-button 네비게이션 바와 앱 탭바가 겹침

#### 수정
- 수동 `height`/`paddingBottom` 계산 제거
- React Navigation의 기본 safe area 처리에 위임
- React Navigation이 `useSafeAreaInsets().bottom`을 자동 적용
- `useSafeAreaInsets` import 및 `Platform` import 제거

## 파일 변경

| 파일 | 변경 |
|------|------|
| `frontend/src/stores/authStore.ts` | restoreSession: refresh token 기반 선제 갱신 |
| `frontend/app/(tabs)/_layout.tsx` | 수동 bottom padding 제거, React Navigation 기본 처리 |

## 검증
- `npx tsc --noEmit` 통과
