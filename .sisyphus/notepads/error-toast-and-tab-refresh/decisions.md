# Architectural Decisions

> Key implementation decisions made during task execution.

---
## Profile Focus Refresh (Task 5)

**Decision**: Profile focus refresh logic placed in profile.tsx screen level, not in ProfileTabs.tsx component.

**Rationale**:
- `useFocusEffect` is a screen-level hook (from expo-router) that triggers when screen gains focus
- Placing logic in profile.tsx (screen) prevents affecting user/[userId].tsx (different screen)
- refreshTrigger prop passed to ProfileTabs allows decoupling: ProfileTabs remains reusable
- user/[userId].tsx uses ProfileTabs without refreshTrigger prop → no auto-refresh on focus (correct behavior)

**Implementation**:
1. profile.tsx: `useFocusEffect` increments `refreshTrigger` state on screen focus
2. ProfileTabs.tsx: Separate `useEffect` watches `refreshTrigger` and calls `fetchTabData(activeTab)`
3. Existing activeTab-triggered `useEffect` remains unchanged (tab switching still works)

**Result**: Profile tab auto-refreshes on screen focus; user profile pages unaffected.
