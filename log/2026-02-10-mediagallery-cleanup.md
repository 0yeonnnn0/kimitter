# 2026-02-10: MediaGallery 적용 완료 및 미사용 코드 정리

## 변경 요약

이전 세션에서 생성한 `MediaGallery` 공용 컴포넌트를 게시물 상세 화면에 적용하고, PostCard에서 남아있던 미사용 스타일을 제거했습니다.

---

## 변경 파일

### 1. `frontend/app/[postId]/index.tsx`

**변경 내용:**
- `MediaGallery` 컴포넌트 import 추가
- 기존 `post.media.map()` + `<Image>` 반복 렌더링을 `<MediaGallery media={post.media} />`로 교체
- 미사용 스타일 `postMedia` (width: 100%, height: 300) 제거

**변경 전:**
```tsx
{post.media.map((m) => (
  <Image
    key={m.id}
    source={{ uri: getFileUrl(m.fileUrl) }}
    style={styles.postMedia}
    resizeMode="cover"
  />
))}
```

**변경 후:**
```tsx
<MediaGallery media={post.media} />
```

### 2. `frontend/src/components/PostCard.tsx`

**변경 내용:**
- 미사용 스타일 4개 제거:
  - `media` (SCREEN_WIDTH 참조 — 미선언 변수 참조로 런타임 에러 가능성 있었음)
  - `modalOverlay`
  - `fullscreenImage`
  - `closeButton`

이 스타일들은 이전에 PostCard 내부에서 직접 이미지/모달을 렌더링할 때 사용되었으나, `MediaGallery` 컴포넌트로 이관된 후 사용되지 않는 채 남아있었습니다.

---

### 3. `frontend/src/components/MediaGallery.tsx` (Threads 스타일 리디자인)

**변경 내용:**
- 썸네일 크기를 Threads 앱 레이아웃에 맞게 대폭 변경:
  - **여러 이미지**: 화면 절반 너비 × 1.5배 높이 (약 179×269pt), 나란히 표시 + 가로 스크롤
  - **단일 이미지**: 전체 너비 × 0.75배 높이 (약 358×269pt)
- 기존 160×100 / 240×150 고정 크기 → 화면 크기 기반 반응형 계산
- borderRadius 10 → 12로 변경

**변경 전:**
```tsx
const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 100;
// thumbnailSingle: 240 × 150
```

**변경 후:**
```tsx
const MULTI_IMAGE_WIDTH = (SCREEN_WIDTH - 32 - 8) / 2;  // ~179pt
const MULTI_IMAGE_HEIGHT = MULTI_IMAGE_WIDTH * 1.5;       // ~269pt
const SINGLE_IMAGE_WIDTH = SCREEN_WIDTH - 32;             // ~358pt
const SINGLE_IMAGE_HEIGHT = SINGLE_IMAGE_WIDTH * 0.75;    // ~269pt
```

### 4. `frontend/src/components/PostCard.tsx` (아이콘 크기 조정)

**변경 내용:**
- 좋아요 아이콘 20→22, 댓글 아이콘 18→20
- 아이콘 색상 #666→#333 (더 진하게)

---

## 검증

- `npx tsc --noEmit` (frontend): 에러 0개 통과
