# 083 - 하단 탭바 시스템 네비게이션 바 겹침 수정

**날짜**: 2025-02-12  
**작업 유형**: 버그 수정 (Android Safe Area)

---

## 문제

Galaxy Z Flip에서 앱의 하단 탭바와 Android 시스템 네비게이션 바(제스처 바)가 겹쳐 보이는 현상.

**원인**: `tabBarStyle`에 `height: 80`, `paddingBottom: 16`이 하드코딩되어 있어서 기기별 시스템 네비게이션 바 높이를 반영하지 못함.

## 수정 내용

**수정 파일**: `frontend/app/(tabs)/_layout.tsx`

- `useSafeAreaInsets()`의 `bottom` 값을 사용하여 동적 `paddingBottom` 계산
- `paddingBottom: Math.max(insets.bottom, 8)` — safe area가 없는 기기에서도 최소 8px 패딩 보장
- `height: 56 + Math.max(insets.bottom, 8)` — 아이콘 영역(56px) + 하단 safe area
- 기존 하드코딩된 `height: 80`, `paddingBottom: 16` 제거

## 영향

- Galaxy Z Flip 등 시스템 네비게이션 바가 있는 Android 기기에서 탭바가 겹치지 않음
- 노치/홈 인디케이터가 있는 iOS 기기에서도 정상 동작
- 시스템 바가 없는 기기에서는 최소 패딩(8px) 적용

---

**Generated**: 2025-02-12 by Sisyphus
