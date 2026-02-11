# 054 - 메인 컬러 블랙/화이트로 변경

**날짜**: 2026-02-11  
**요청**: 앱 전체 메인 컬러를 블랙/화이트로 변경. 태그 기능만 파란색 유지.

---

## 변경 사항

### 컬러 매핑

| 기존 | 변경 | 적용 대상 |
|------|------|-----------|
| `#007AFF` (파란색) | `#000` (블랙) | 버튼 배경, 아바타 플레이스홀더, 아이콘, 링크 텍스트, ActivityIndicator |
| `#007AFF` | `#666` | 답글 버튼 (약한 액션) |
| `#007AFF` | `#333` | 답글 바 텍스트 |
| `#f0f7ff` (연한 파랑) | `#f5f5f5` (연한 회색) | 답글 바 배경, 읽지 않은 알림 배경, 초대 아이콘 배경 |
| `#007AFF` | **유지** | 태그 텍스트, 태그 아이콘, 태그 칩, 태그 breadcrumb |
| `#f0f7ff` | **유지** | 태그 칩 배경, 태그 아이콘 배경 |

### 변경 파일 (12개)

| 파일 | 변경 항목 |
|------|-----------|
| `frontend/app/[postId]/index.tsx` | 뒤로가기 아이콘, 아바타 플레이스홀더, 답글 버튼, 답글 바, 전송 버튼 |
| `frontend/app/(auth)/login.tsx` | 로그인 버튼, 링크 텍스트 |
| `frontend/app/(auth)/register.tsx` | 가입 버튼 |
| `frontend/app/(auth)/invite-code.tsx` | 확인 버튼, 링크 텍스트 |
| `frontend/app/(tabs)/activity.tsx` | 모두 읽음 버튼, 아바타 배경, 읽지 않은 알림 배경 |
| `frontend/app/(tabs)/profile.tsx` | 아바타 플레이스홀더 |
| `frontend/app/(tabs)/search.tsx` | 캘린더 아이콘, 검색 배지, 유저 아바타 플레이스홀더 |
| `frontend/app/user/[userId].tsx` | 아바타 플레이스홀더 |
| `frontend/src/components/PostCard.tsx` | 아바타 플레이스홀더 |
| `frontend/src/components/EditProfileModal.tsx` | ActivityIndicator, 완료 텍스트, 아바타 플레이스홀더 |
| `frontend/src/components/InviteModal.tsx` | ActivityIndicator, 메일 아이콘, 초대 텍스트, 아이콘 배경 |
| `frontend/src/components/CreatePostModal.tsx` | 게시 버튼, 태그 추가 버튼 |

### 파란색 유지 항목 (태그 전용)

- `PostCard.tsx` — 태그 텍스트 (`#007AFF`)
- `[postId]/index.tsx` — 태그 텍스트 (`#007AFF`)
- `CreatePostModal.tsx` — 태그 칩 텍스트 (`#007AFF`), 태그 칩 배경 (`#f0f7ff`)
- `search.tsx` — 태그 아이콘 (`#007AFF`), 태그 breadcrumb (`#007AFF`), 태그 아이콘 배경 (`#f0f7ff`)

---

## 검증

- `npx tsc --noEmit` — 에러 0개
