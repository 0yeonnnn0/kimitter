# 096 — 비디오 썸네일 비율 수정

**날짜**: 2026-02-21

## 문제
- 비디오 썸네일이 16:9(가로) 기본 비율로 표시 → 세로 영상에 양쪽 회색 여백 발생

## 수정
- 비디오 기본 비율: 16:9 → 1:1 (정사각형) — 세로/가로 영상 모두 적절한 컨테이너 크기
- VideoThumbnailItem에 `contentFit="cover"` 추가 — 사진의 `resizeMode="cover"`와 동일하게 컨테이너를 꽉 채움

## 파일
- `frontend/src/components/MediaGallery.tsx`
