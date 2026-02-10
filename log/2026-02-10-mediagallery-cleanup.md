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

## 검증

- `npx tsc --noEmit` (frontend): 에러 0개 통과
