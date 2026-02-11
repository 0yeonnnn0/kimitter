# 052 - 'Family Threads' → 'Kimitter' 전체 리네이밍

**날짜**: 2026-02-11  
**요청**: "'Family Threads'라는 문구를 모두 Kimitter로 고쳐"

---

## 변경 사항

### 프론트엔드

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/app/(tabs)/index.tsx` | 홈 헤더 타이틀 "Family Threads" → "Kimitter" |
| `frontend/app/(auth)/login.tsx` | 로그인 화면 타이틀 → "Kimitter" |
| `frontend/app/(auth)/register.tsx` | 회원가입 환영 문구 → "Kimitter에 오신 것을 환영합니다!" |
| `frontend/app.json` | Expo 앱 이름 "Family Threads" → "Kimitter" |

### 백엔드

| 파일 | 변경 내용 |
|------|-----------|
| `backend/src/services/emailService.ts` | 이메일 제목/본문 내 "Family Threads" → "Kimitter" |
| `backend/src/config/environment.ts` | SMTP from 기본값 "Family Threads" → "Kimitter" |
| `backend/.env` | SMTP_FROM 값 → "Kimitter <noreply@kimitter.app>" |
| `backend/package.json` | description → "Kimitter - Private family SNS backend API" |

### 문서 파일

| 파일 | 변경 내용 |
|------|-----------|
| `README.md` | 제목 "# Family Threads" → "# Kimitter" |
| `CHANGELOG.md` | 프로젝트명 → "Kimitter project" |
| `AGENTS.md` | 저장소 설명 2곳 → "Kimitter repository", "Kimitter — Private family-only SNS app" |
| `family-app-plan.md` | 프로젝트명 → "Kimitter" |

---

## 총 변경 파일: 12개
