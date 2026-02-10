# 033. 이메일 기반 유저 초대 시스템

**날짜**: 2026-02-10
**요약**: Admin이 이메일로 초대 코드를 발송하여 새 유저를 가입시키는 기능 구현

---

## 변경 사항

### 백엔드

1. **nodemailer 설치** (`package.json`)
   - `nodemailer` + `@types/nodemailer` 패키지 추가

2. **SMTP 환경변수 추가** (`src/config/environment.ts`, `.env.example`, `.env`)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

3. **InvitationCode 스키마 수정** (`prisma/schema.prisma`)
   - `email` 필드 추가 (`String?`, VarChar 255)
   - 마이그레이션: `add_email_to_invitation_codes`

4. **이메일 발송 서비스** (`src/services/emailService.ts`) — 신규 파일
   - `sendInvitationEmail(email, code)` — nodemailer로 HTML 이메일 발송
   - SMTP 미설정 시 로그에 코드 출력 (개발 환경 대응)
   - 발송 성공/실패 여부를 boolean으로 반환

5. **adminService 수정** (`src/services/adminService.ts`)
   - `generateInviteCode()` — 6자리 영숫자 (혼동 문자 I/O/1/0 제외)
   - `inviteByEmail(adminId, email)` — 코드 생성 + DB 저장 + 이메일 발송
   - 동일 이메일 중복 초대 방지 (미사용 코드 존재 시 에러)
   - 만료일 자동 설정 (7일)

6. **admin 컨트롤러/라우트/밸리데이션**
   - `POST /admin/invite` 엔드포인트 추가
   - `inviteByEmailSchema` — Joi email 검증

### 프론트엔드

7. **Admin 서비스** (`src/services/adminService.ts`) — 신규 파일
   - `inviteByEmail(email)` API 호출 함수

8. **프로필 화면** (`app/(tabs)/profile.tsx`)
   - Admin 유저에게만 "가족 초대하기" 섹션 표시
   - 이메일 입력 + 전송 버튼 UI
   - 이메일 형식 검증 (프론트 + 백엔드 양쪽)
   - 성공 시: 이메일 발송 성공/실패에 따른 안내 (SMTP 미설정 시 코드 직접 표시)

---

## 전체 초대 플로우

```
Admin 프로필 → 이메일 입력 → POST /admin/invite
  → 6자리 코드 생성 + DB 저장 + 이메일 발송
  → 유저가 이메일에서 코드 확인
  → 앱 로그인 화면 → "초대 코드로 가입하기"
  → 코드 입력 → POST /auth/validate-code
  → 회원가입 (username, nickname, password) → POST /auth/register
  → 자동 로그인
```

## 검증

- ✅ Backend `tsc --noEmit` — 에러 0개
- ✅ Frontend `tsc --noEmit` — 에러 0개

## SMTP 설정 방법

Gmail 사용 시:
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성 (mail 용)
3. `.env`에 설정:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```
