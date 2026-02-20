# 091 — expo-video 마이그레이션 + BottomSheet z-index 수정

**날짜**: 2026-02-21

## 변경 사항

### 1. expo-av → expo-video 마이그레이션 (`MediaGallery.tsx`)

#### 배경
- `expo-av`의 `Video` 컴포넌트가 deprecated됨
- `expo-video`의 `useVideoPlayer` + `VideoView` API로 교체

#### 변경 내용
- **import**: `Video, ResizeMode` (expo-av) → `VideoView, useVideoPlayer` (expo-video)
- **VideoThumbnailItem 컴포넌트**: 피드 목록의 비디오 썸네일용 (paused, nativeControls=false, play overlay)
- **FullscreenVideoPlayer 컴포넌트**: 풀스크린 뷰어의 비디오 재생용 (auto-play)
- `useVideoPlayer`는 hook이므로 map 내부가 아닌 별도 컴포넌트로 분리
- `expo-av` 패키지 제거 (`npm uninstall expo-av`)

#### 왜 별도 컴포넌트?
`useVideoPlayer`는 React hook이라 반복문/조건문 내부에서 호출 불가.
→ `VideoThumbnailItem`, `FullscreenVideoPlayer` 두 컴포넌트로 분리하여 각각 hook 호출.

### 2. BottomSheet z-index 수정 (`[postId]/index.tsx`)

#### 문제
- 댓글 수정/삭제 BottomSheet가 댓글 입력창 아래에 가려져서 보임
- BottomSheet가 JSX에서 `commentInputRow`보다 먼저 렌더링되어 뒤에 깔림

#### 수정
- BottomSheet를 `KeyboardAvoidingView`의 마지막 자식으로 이동
- React Native에서 나중에 렌더링된 sibling이 위에 표시되므로, BottomSheet가 입력창 위에 올라옴

## 파일 변경

| 파일 | 변경 |
|------|------|
| `frontend/src/components/MediaGallery.tsx` | expo-av → expo-video 마이그레이션 |
| `frontend/app/[postId]/index.tsx` | BottomSheet 위치 이동 (맨 마지막) |
| `frontend/package.json` | expo-av 제거, expo-video 추가 |

## 검증
- `npx tsc --noEmit` 통과 (expo-av 제거 후에도)
