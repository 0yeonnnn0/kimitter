# Kimitter

가족 4명만을 위한 폐쇄형 SNS 앱. 초대 코드 기반 가입, 사진/GIF/동영상 공유, 댓글·좋아요·알림 기능을 제공합니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | React Native, Expo (SDK 54), Expo Router, Zustand, Axios |
| **백엔드** | Node.js, Express.js, TypeScript |
| **데이터베이스** | PostgreSQL 14+, Prisma ORM |
| **인증** | JWT (Access + Refresh Token), bcryptjs |
| **파일 저장** | 로컬 파일시스템 (NAS `/media/uploads/`) |
| **푸시 알림** | Expo Push Notification (expo-server-sdk) |
| **테스트** | Jest + ts-jest |
| **패키지 매니저** | npm |

---

## 프로젝트 구조

```
example/
├── backend/                    # Express API 서버
│   ├── src/
│   │   ├── config/             # DB, Multer, JWT, 환경변수 설정
│   │   ├── controllers/        # 라우트 핸들러 (thin layer)
│   │   ├── routes/             # API 라우트 정의
│   │   ├── middleware/         # auth, errorHandler, validate, admin
│   │   ├── services/           # 비즈니스 로직
│   │   ├── types/              # TypeScript 공유 타입
│   │   ├── utils/              # errors, jwt, logger
│   │   └── test/               # 테스트 헬퍼
│   ├── prisma/
│   │   └── schema.prisma       # DB 스키마 (11개 모델)
│   ├── jest.config.ts
│   ├── docker-compose.yml
│   └── .env
│
└── frontend/                   # React Native (Expo) 앱
    ├── app/
    │   ├── _layout.tsx         # 루트 레이아웃 + 인증 게이트
    │   ├── (auth)/             # 로그인·초대코드·회원가입
    │   ├── (tabs)/             # 메인 5탭 (홈·검색·작성·활동·프로필)
    │   └── [postId]/           # 게시물 상세 + 댓글
    ├── src/
    │   ├── stores/             # Zustand 상태 관리
    │   ├── services/           # Axios API 호출
    │   ├── components/         # 공유 UI 컴포넌트
    │   ├── types/              # 공유 타입
    │   └── config/             # 상수, API URL
    └── .env
```

---

## 데이터베이스 스키마

총 11개 모델:

| 모델 | 설명 |
|------|------|
| `User` | 사용자 (username, nickname, role: USER/ADMIN) |
| `InvitationCode` | 초대 코드 (1회성, 만료일 설정 가능) |
| `RefreshToken` | JWT 리프레시 토큰 저장 |
| `Post` | 게시물 (소프트 삭제) |
| `PostMedia` | 게시물 미디어 (PHOTO/GIF/VIDEO) |
| `Tag` | 태그 |
| `PostTag` | 게시물-태그 다대다 |
| `Comment` | 댓글 (대댓글 지원, 소프트 삭제) |
| `Like` | 게시물/댓글 좋아요 |
| `Notification` | 알림 (POST_MENTION/COMMENT/REPLY/LIKE/CUSTOM) |
| `PushToken` | Expo 푸시 토큰 |

---

## API 엔드포인트

| 그룹 | 주요 엔드포인트 |
|------|---------------|
| **Auth** | POST `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/validate-code`, `/auth/password-change` |
| **Posts** | GET/POST `/posts`, GET/PUT/DELETE `/posts/:id`, GET `/posts/search` |
| **Comments** | GET `/comments/post/:id`, POST `/comments/post/:id`, PUT/DELETE `/comments/:id`, POST `/comments/:id/replies` |
| **Likes** | POST/DELETE `/posts/:id/like`, POST/DELETE `/comments/:id/like` |
| **Tags** | GET `/tags`, GET `/tags/popular`, GET `/tags/search`, GET `/tags/:name/posts` |
| **Users** | GET `/users/me`, PUT `/users/me`, GET `/users/:id/posts` |
| **Notifications** | GET `/notifications`, GET `/notifications/unread`, PUT `/notifications/:id/read`, PUT `/notifications/read-all` |
| **Activity** | GET `/activity` |
| **Admin** | GET `/admin/users`, PUT `/admin/users/:id`, GET `/admin/invitation-codes`, POST `/admin/invitation-codes` |

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- PostgreSQL 14+ (또는 Docker)
- Xcode (iOS 시뮬레이터) / Android Studio (Android 에뮬레이터)

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repo-url>
cd example

# 백엔드
cd backend && npm install

# 프론트엔드
cd ../frontend && npm install
```

### 2. 환경변수 설정

**백엔드** (`backend/.env`):
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://family_user:family_secret_pw@localhost:5432/family_threads
JWT_SECRET=your-jwt-secret-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
EXPO_ACCESS_TOKEN=your-expo-access-token
```

**프론트엔드** (`frontend/.env`):
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

> 실제 기기에서 테스트할 때는 `localhost` 대신 Mac의 로컬 IP를 사용하세요.  
> 예: `EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api`

### 3. 데이터베이스 시작

```bash
# Docker로 PostgreSQL 실행
cd backend
docker-compose up -d

# 또는 로컬 PostgreSQL 사용 시 DB/유저 생성 후:
npx prisma migrate dev --name init
npx prisma generate
```

### 4. 백엔드 서버 시작

```bash
cd backend
npm run dev
# → http://localhost:3000/api/health 응답 확인
```

### 5. 프론트엔드 앱 시작

```bash
cd frontend
npx expo start          # QR코드 (Expo Go 앱)
npx expo start --ios    # iOS 시뮬레이터
npx expo start --android # Android 에뮬레이터
```

---

## 테스트 실행

### 백엔드 (Jest + ts-jest)

```bash
cd backend

# 전체 테스트 실행
npm test

# 단일 파일 실행
npm test -- src/services/authService.test.ts

# 테스트 이름으로 필터
npm test -- -t "login"

# Watch 모드 (개발 중)
npm run test:watch

# 커버리지 포함
npm test -- --coverage
```

**테스트 현황 (58개, 전체 통과):**

| 테스트 파일 | 케이스 수 | 주요 커버 |
|------------|----------|---------|
| `utils/errors.test.ts` | 7 | AppError 계층, 상태 코드 |
| `utils/jwt.test.ts` | 4 | 토큰 생성/검증, 변조 감지 |
| `middleware/auth.test.ts` | 4 | Bearer 토큰 파싱, 권한 검사 |
| `services/authService.test.ts` | 10 | 회원가입, 로그인, 로그아웃, 초대코드 |
| `services/postService.test.ts` | 10 | 게시물 CRUD, 페이지네이션, 권한 |
| `services/commentService.test.ts` | 9 | 댓글/답글, 수정/삭제 권한 |
| `services/likeService.test.ts` | 4 | 좋아요 토글 |
| `services/userService.test.ts` | 4 | 유저 조회/수정 |
| `services/notificationService.test.ts` | 5 | 알림 조회, 읽음 처리 |
| `services/tagService.test.ts` | 2 | 태그 조회 |

### 프론트엔드

현재 별도의 Jest 설정이 없습니다. 타입 검사로 대체합니다:

```bash
cd frontend
npx tsc --noEmit
```

---

## 실사용 가이드

### 테스트 계정 (이미 생성됨)

로컬 환경에서 즉시 테스트 가능한 계정:

| 계정 유형 | 아이디 | 비밀번호 | 닉네임 | 역할 |
|---------|--------|---------|--------|------|
| **관리자** | `admin` | `admin1234` | 관리자 | ADMIN |
| **일반 유저** | `testuser` | `test1234` | 테스트유저 | USER |

**앱 실행 후 위 아이디/비밀번호로 바로 로그인하여 기능을 테스트할 수 있습니다.**

#### 빠른 테스트 방법

1. **백엔드 서버 시작**
   ```bash
   cd backend && npm run dev
   # http://localhost:3000/api/health 응답 확인
   ```

2. **프론트엔드 앱 시작**
   ```bash
   cd frontend && npx expo start --ios
   # (또는 --android)
   ```

3. **로그인**
   - 앱 로그인 화면에서 `admin` / `admin1234` 입력
   - 자동 로그인 → 홈 화면 이동

4. **기능 테스트**
   - 하단 **+** 탭: 게시물 작성 (텍스트/사진/태그)
   - 🏠 홈: 게시물 목록, 좋아요, 댓글
   - 🔍 검색: 게시물/태그 검색
   - 🔔 활동: 알림 확인
   - 👤 프로필: 내 정보, 로그아웃

### 1. 추가 계정 만들기 (선택)

백엔드 서버 시작 후 Prisma Studio로 초대 코드를 생성합니다:

```bash
cd backend
npx prisma studio
# → http://localhost:5555 에서 InvitationCode 테이블에 레코드 추가
# code: "FAMILY2024", expiresAt: null (만료 없음)
```

또는 curl로 직접:
```bash
# 관리자 로그인 후 토큰 획득
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# 초대 코드 생성 (관리자 토큰 필요)
curl -X POST http://localhost:3000/api/admin/invitation-codes \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"code":"FAMILY2024"}'
```

### 2. 앱에서 가입하기

1. 앱 실행 → 로그인 화면
2. **"초대 코드로 가입하기"** 탭
3. 초대 코드 입력 (`FAMILY2024`)
4. 아이디, 닉네임, 비밀번호 입력
5. 가입 완료 → 자동 로그인

### 3. 게시물 작성

1. 하단 탭 **"+"** 버튼 탭
2. 텍스트 입력 및/또는 사진/동영상 선택
3. 태그 추가 (선택)
4. **"게시"** 버튼

### 4. 관리자 기능

DB에서 직접 특정 유저의 `role`을 `ADMIN`으로 변경하거나 Prisma Studio에서 수정:

```bash
cd backend && npx prisma studio
# users 테이블 → role 컬럼 → ADMIN으로 변경
```

관리자는 다음이 가능합니다:
- 모든 게시물/댓글 삭제
- 초대 코드 생성/관리
- 유저 활성/비활성 처리

---

## 개발 명령어 요약

### 백엔드

```bash
npm run dev          # 개발 서버 (nodemon + ts-node)
npm run build        # TypeScript 컴파일
npm start            # 프로덕션 서버
npm test             # Jest 테스트
npm run lint         # ESLint
npx tsc --noEmit     # 타입 검사
npx prisma studio    # DB GUI
npx prisma migrate dev --name <name>  # 마이그레이션
```

### 프론트엔드

```bash
npx expo start       # 개발 서버
npx expo start --ios # iOS 시뮬레이터
npx expo start --android # Android 에뮬레이터
npx tsc --noEmit     # 타입 검사
npx expo export      # 정적 빌드
eas build --platform ios     # iOS 배포 빌드
eas build --platform android # Android 배포 빌드
```

---

## 주요 개발 결정사항

| 결정 | 이유 |
|------|------|
| Expo Router (파일 기반 라우팅) | 직관적인 네비게이션 구조, 딥링크 자동 지원 |
| Zustand (상태 관리) | Redux 대비 보일러플레이트 최소화 |
| SecureStore (토큰 저장) | AsyncStorage 대비 보안 강화 |
| Prisma ORM | 타입 안전한 DB 쿼리, 마이그레이션 관리 |
| JWT 이중 토큰 | Access(1h) + Refresh(7d) 보안/편의성 균형 |
| 소프트 삭제 | 게시물/댓글에 `deletedAt` 컬럼으로 복구 가능 |
| 낙관적 업데이트 | 좋아요 등 UI 즉각 반응, 실패 시 롤백 |

---

## 최근 업데이트 (2026-02-09)

### 1. 네트워크 연결 문제 해결 ✅
**문제**: iOS 시뮬레이터에서 `localhost` 접근 불가로 Network Error 발생  
**해결**: 
- `frontend/.env`의 API URL을 Mac의 실제 IP 주소로 변경
- `EXPO_PUBLIC_API_URL=http://192.168.219.51:3000/api`
- iOS 시뮬레이터는 `localhost`를 자기 자신으로 인식하므로 호스트 머신 IP 필요

### 2. 사진 업로드 문제 해결 ✅
**문제**: 
- 15초 타임아웃으로 큰 이미지 업로드 실패
- Network Error 발생 (요청이 서버에 도달하지 못함)
- iOS HEIC 포맷 파일 처리 문제

**해결**:
- API 타임아웃 15초 → 60초로 증가 (`frontend/src/services/api.ts`)
- `expo-image-manipulator` 설치 및 자동 이미지 압축 추가
  - 업로드 전 1920px 너비로 리사이징
  - JPEG 압축률 70% 적용 (HEIC → JPEG 자동 변환)
  - 동영상은 원본 유지
- 백엔드 Express body parser 크기 제한 증가 (100kb → 50mb)
- 백엔드 Multer 필드명 `files` → `media`로 통일
- 게시물 생성 시 `content` 필드를 선택적으로 변경 (이미지만 올리는 경우 대응)
- 파일명 생성 로직 개선 (타임스탬프 + 인덱스로 고유성 보장)

**파일**:
- `frontend/src/services/api.ts` (timeout: 60000)
- `frontend/app/(tabs)/create.tsx` (이미지 압축 + 파일명 생성)
- `backend/src/app.ts` (body parser limit: 50mb)
- `backend/src/routes/posts.ts` (필드명 통일)
- `backend/src/validations/postValidation.ts` (content 선택적)

### 3. 좋아요 기능 버그 수정 ✅
**문제**: 
- 좋아요 버튼 클릭 시 숫자가 잠시 1로 변경되었다가 0으로 되돌아감
- 게시물 상세 화면에 좋아요 UI 없음

**근본 원인**: 
1. 백엔드가 각 게시물에 대한 현재 사용자의 좋아요 여부(`isLiked`)를 반환하지 않음
2. 프론트엔드와 백엔드의 API 엔드포인트 불일치
   - 프론트엔드: `/api/posts/:id/like` (POST/DELETE)
   - 백엔드: `/api/likes/posts/:id` (토글 방식)
3. 백엔드는 토글 방식인데 프론트엔드는 명시적 like/unlike 방식 사용

**해결 방법:**
- **백엔드**: 
  - `addIsLiked()` 헬퍼 함수 추가하여 각 게시물에 사용자별 좋아요 상태 포함
  - `getPosts`, `getPostById`, `searchPosts` 모두 `isLiked: boolean` 필드 반환
  - `/api/posts/:id/like` 엔드포인트 추가 (프론트엔드 호환)
- **프론트엔드**: 
  - `Post` 인터페이스에 `isLiked` 필드 추가
  - 홈 화면에서 로컬 state 제거, 서버 데이터 직접 사용
  - `togglePostLike` API로 통일 (백엔드 토글 방식에 맞춤)
  - 게시물 상세 화면에 좋아요 버튼 UI 추가

**파일**:
- `backend/src/services/postService.ts` (addIsLiked 헬퍼)
- `backend/src/controllers/postController.ts` (userId 전달)
- `backend/src/routes/posts.ts` (좋아요 엔드포인트 추가)
- `frontend/src/types/models.ts` (Post.isLiked 추가)
- `frontend/src/services/likeService.ts` (togglePostLike로 통일)
- `frontend/src/stores/feedStore.ts` (토글 API 사용)
- `frontend/app/(tabs)/index.tsx` (로컬 state 제거)
- `frontend/app/[postId]/index.tsx` (좋아요 UI + 토글 API)

### 4. 세션 복원 에러 핸들링 강화 ✅
**변경**: `authStore.restoreSession`에 try/catch 추가
- 손상되거나 만료된 토큰 자동 정리
- 로그인 화면으로 깔끔한 리다이렉션

**파일**: `frontend/src/stores/authStore.ts`

---

## 알려진 이슈 및 TODO

- [ ] Push notification 실제 연동 (Expo token 등록/발송)
- [ ] Admin UI 구현 (초대 코드 생성, 유저 관리)
- [ ] 댓글/답글에 좋아요 UI 추가
- [ ] NAS 배포 설정 (Docker, Nginx 리버스 프록시)
- [ ] EAS Build 설정 (TestFlight/Play Store)
- [ ] 동영상 재생 UI 개선
- [ ] 프로필 이미지 업로드 기능
- [ ] 게시물 수정 기능 프론트엔드 구현
