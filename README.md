# Kimitter

가족 4명만을 위한 폐쇄형 SNS 앱. 초대 코드 기반 가입, 사진/GIF/동영상 공유, 푸시 알림, Threads 스타일 UI를 제공합니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | React Native, Expo (SDK 54), Expo Router, Zustand, Axios |
| **백엔드** | Node.js, Express.js, TypeScript |
| **데이터베이스** | PostgreSQL 14+, Prisma ORM |
| **인증** | JWT (Access + Refresh Token), bcryptjs |
| **파일 저장** | 로컬 파일시스템 (NAS `/media/uploads/`) |
| **푸시 알림** | Expo Push Notification (expo-notifications, expo-server-sdk) |
| **컨테이너** | Docker, Docker Compose |
| **빌드/배포** | EAS Build (expo-dev-client), APK/iOS 시뮬레이터 |
| **테스트** | Jest + ts-jest |
| **패키지 매니저** | npm |

---

## 주요 기능

### 인증 및 가입

- JWT 이중 토큰 인증 (Access 1h + Refresh 7d)
- 초대 코드 기반 폐쇄형 가입 (관리자가 코드 생성)
- 이메일 기반 유저 초대 시스템 (6자리 코드 자동 생성)
- 세션 자동 복원 및 만료 토큰 자동 정리
- 비밀번호 표시/숨기기 토글 (로그인, 회원가입)

### 홈 피드

- Threads 스타일 2-column 레이아웃 (아바타 | 콘텐츠)
- 상단 compose prompt ("새로운 소식이 있나요?") - 탭하면 글 작성 모달 열림
- FlatList 기반 무한 스크롤 페이지네이션
- Pull-to-refresh

### 게시물 작성

- 텍스트 + 미디어(사진/GIF/동영상) + 태그 작성
- 이미지 자동 압축 (1920px 리사이징, JPEG 70%, HEIC->JPEG 자동 변환)
- BottomSheet 기반 풀스크린 모달
- 드롭다운 모드 선택: 새 글 쓰기 / 알림 보내기 (브로드캐스트)
- 드롭다운이 헤더 바로 아래에 인라인 위치

### 게시물 표시

- Threads 스타일 이미지 갤러리 (원본 비율 유지, 가로 스크롤)
- 단독 이미지는 레이아웃 폭에 맞춰 동적 크기 조정
- 미디어 스크롤 시 아바타 영역 위로 오버랩 가능
- 좋아요 토글 (낙관적 업데이트)
- 댓글 + 대댓글 (답글)

### 게시물 액션 (... 버튼)

- 화면 하단 ActionSheet (PostActionSheet)
- 좋아요, 댓글 달기 메뉴
- 본인 글이면 삭제 옵션 추가
- 화면 레벨 단일 인스턴스로 중복 방지

### 프로필

- Threads 스타일 프로필 레이아웃 (닉네임, @username, bio)
- 프로필 탭 (스레드 / 답글 / 미디어)
- 프로필 편집 모달 (닉네임, bio, 프로필 사진 변경)
- 프로필 이미지 확대 보기 (풀스크린 모달, 위/아래 스와이프로 닫기, 배경 fade 효과)
- 이미지가 없을 때도 탭하면 기본 아이콘 확대 표시
- 기본 아바타: Ionicons person 아이콘 (밝은 회색 원형 배경)
- 타 유저 프로필 페이지 (게시물 피드에서 아바타/닉네임 탭으로 이동)

### 검색

- 태그 검색 + 유저 검색 모드 전환 (필터 버튼)
- 기본 화면: 월별 미디어 갤러리 그리드 (텍스트 전용 게시물 포함)
- 캘린더 아이콘으로 월 이동

### 활동 (알림)

- 좋아요 / 댓글 / 답글 / 멘션 / 커스텀 알림 표시
- 읽음 처리 (읽어도 목록에서 유지)
- 30일 지난 알림 자동 삭제
- Pull-to-refresh
- 프로필 이미지 있는 경우 알림에 이미지 표시

### 푸시 알림

- expo-notifications 연동
- Expo Push Token 등록/관리
- 브로드캐스트 알림 전송 기능 (글 작성 모달에서 "알림 보내기" 선택)

### 관리자 기능

- 유저 초대 (이메일 기반 초대 코드 생성, 중복 시 기존 코드 표시)
- 모든 게시물/댓글 삭제 권한
- 유저 활성/비활성 처리
- 프로필 페이지에서 "유저 초대하기" 버튼

---

## UI/UX 디자인

| 항목 | 설명 |
|------|------|
| 컬러 스킴 | 블랙/화이트 기조 (배경 흰색, 텍스트 검정) |
| 레이아웃 | Threads 스타일 2-column (아바타 열 + 콘텐츠 열) |
| 하단 탭바 | 아이콘만 표시 (텍스트 라벨 제거), 상단 패딩 8px |
| 기본 아바타 | Ionicons `person` 아이콘, `#e8e8e8` 배경 |
| 글 구분선 | 회색 (`#e0e0e0`) 수평선 |
| 이미지 뷰어 | 풀스크린 검정 배경, 스와이프 dismiss, 배경 fade |
| 모달 | BottomSheet 기반 슬라이드 업/다운 애니메이션 |

---

## 프로젝트 구조

```
example/
├── backend/                        # Express API 서버
│   ├── src/
│   │   ├── config/                 # DB, Multer, JWT, 환경변수 설정
│   │   ├── controllers/            # 라우트 핸들러 (thin layer)
│   │   ├── routes/                 # API 라우트 정의
│   │   ├── middleware/             # auth, errorHandler, validate, admin
│   │   ├── services/               # 비즈니스 로직
│   │   ├── types/                  # TypeScript 공유 타입
│   │   ├── utils/                  # errors, jwt, logger
│   │   └── test/                   # 테스트 헬퍼
│   ├── prisma/
│   │   └── schema.prisma           # DB 스키마 (11개 모델)
│   ├── Dockerfile                  # Multi-stage 빌드
│   ├── .dockerignore
│   ├── docker-compose.yml          # PostgreSQL + Backend 서비스
│   ├── jest.config.ts
│   └── .env
│
├── frontend/                       # React Native (Expo) 앱
│   ├── app/
│   │   ├── _layout.tsx             # 루트 레이아웃 + 인증 게이트
│   │   ├── (auth)/                 # 로그인, 초대코드, 회원가입
│   │   ├── (tabs)/                 # 메인 5탭 (홈/검색/작성/활동/프로필)
│   │   │   ├── index.tsx           # 홈 피드 (compose prompt + PostCard 목록)
│   │   │   ├── search.tsx          # 검색 (태그/유저 + 월별 갤러리)
│   │   │   ├── activity.tsx        # 활동 알림
│   │   │   ├── profile.tsx         # 내 프로필
│   │   │   └── _layout.tsx         # 탭 레이아웃 + CreatePostModal + PostActionSheet
│   │   ├── [postId]/               # 게시물 상세 + 댓글
│   │   └── user/[userId].tsx       # 타 유저 프로필
│   ├── src/
│   │   ├── stores/                 # Zustand 상태 관리
│   │   │   ├── authStore.ts        # 인증 상태 (로그인/로그아웃/토큰)
│   │   │   ├── feedStore.ts        # 피드 상태 (게시물 목록/좋아요)
│   │   │   ├── notificationStore.ts # 알림 상태
│   │   │   ├── postActionStore.ts  # PostActionSheet 상태
│   │   │   └── createModalStore.ts # 글 작성 모달 open/close 상태
│   │   ├── services/               # Axios API 호출
│   │   ├── components/             # 공유 UI 컴포넌트
│   │   │   ├── PostCard.tsx        # 게시물 카드 (2-column 레이아웃)
│   │   │   ├── MediaGallery.tsx    # 이미지/동영상 갤러리
│   │   │   ├── PostActionSheet.tsx # 게시물 액션 시트 (좋아요/댓글/삭제)
│   │   │   ├── CreatePostModal.tsx # 글 작성 모달 (드롭다운 모드)
│   │   │   ├── EditProfileModal.tsx # 프로필 편집 모달
│   │   │   ├── ImageViewerModal.tsx # 프로필 이미지 확대 보기
│   │   │   ├── ProfileTabs.tsx     # 프로필 탭 (스레드/답글/미디어)
│   │   │   ├── BottomSheet.tsx     # 공용 바텀시트 컴포넌트
│   │   │   └── InviteModal.tsx     # 유저 초대 모달
│   │   ├── types/                  # 공유 타입
│   │   └── config/                 # 상수, API URL
│   ├── eas.json                    # EAS Build 프로필 설정
│   └── .env
│
└── log/                            # 변경 이력 로그 (MD 파일)
```

---

## 인프라 및 배포

### 백엔드 Docker 컨테이너화

Multi-stage Dockerfile로 빌드 최적화. `docker-compose.yml`로 PostgreSQL + Backend를 함께 관리.

```bash
cd backend

# 전체 서비스 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f backend

# 중지
docker-compose down
```

### EAS Build (Development Client)

Expo Go 대신 development build를 사용하여 expo-notifications 등 네이티브 기능 완전 지원.

```bash
cd frontend

# iOS 시뮬레이터용 development build
eas build --profile development --platform ios

# Android 실기기용 development build (APK)
eas build --profile development-device --platform android

# 배포용 APK 빌드
eas build --profile preview --platform android

# development build 앱에서 개발 서버 연결
npx expo start --dev-client
```

**EAS Build 프로필:**

| 프로필 | 용도 | 플랫폼 |
|--------|------|--------|
| `development` | iOS 시뮬레이터 개발 | iOS (simulator) |
| `development-device` | 실기기 개발 (APK) | Android |
| `preview` | 내부 배포용 APK | Android |
| `production` | 스토어 배포 | iOS / Android |

---

## 데이터베이스 스키마

총 11개 모델:

| 모델 | 설명 |
|------|------|
| `User` | 사용자 (username, nickname, bio, profileImageUrl, role: USER/ADMIN) |
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
| **Users** | GET `/users/me`, PUT `/users/me`, GET `/users/:id`, GET `/users/:id/posts` |
| **Notifications** | GET `/notifications`, GET `/notifications/unread`, PUT `/notifications/:id/read`, PUT `/notifications/read-all`, POST `/notifications/broadcast` |
| **Activity** | GET `/activity` |
| **Admin** | GET `/admin/users`, PUT `/admin/users/:id`, GET `/admin/invitation-codes`, POST `/admin/invitation-codes` |

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- Docker (PostgreSQL 컨테이너용)
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

> 실제 기기 또는 iOS 시뮬레이터에서 테스트할 때는 `localhost` 대신 Mac의 로컬 IP를 사용하세요.
> 예: `EXPO_PUBLIC_API_URL=http://192.168.219.51:3000/api`

### 3. 데이터베이스 및 백엔드 시작

**방법 A: Docker로 전체 실행 (권장)**
```bash
cd backend
docker-compose up -d --build
```

**방법 B: DB만 Docker + 로컬 개발 서버**
```bash
cd backend
docker-compose up -d    # PostgreSQL만 실행
npx prisma migrate dev  # 마이그레이션 적용
npm run dev             # 개발 서버 시작
```

### 4. 프론트엔드 앱 시작

**Expo Go로 실행 (간편, 일부 기능 제한):**
```bash
cd frontend
npx expo start --ios       # iOS 시뮬레이터
npx expo start --android   # Android 에뮬레이터
```

**Development Build로 실행 (전체 기능 지원):**
```bash
cd frontend
# 최초 1회: development build 생성
eas build --profile development --platform ios
# 또는
eas build --profile development-device --platform android

# 이후 개발 서버 실행
npx expo start --dev-client
```

> Development build는 expo-notifications 등 네이티브 모듈이 완전히 작동합니다.
> Expo Go에서는 푸시 알림 관련 경고가 표시됩니다.

---

## 테스트 계정

로컬 환경에서 즉시 테스트 가능한 계정:

| 계정 유형 | 아이디 | 비밀번호 | 닉네임 | 역할 |
|---------|--------|---------|--------|------|
| **관리자** | `admin` | `admin1234` | 관리자 | ADMIN |
| **일반 유저** | `testuser` | `test1234` | 테스트유저 | USER |

### 추가 계정 만들기

관리자 로그인 후 앱 내 프로필 페이지에서 "유저 초대하기" 버튼을 통해 초대 코드를 생성할 수 있습니다.

또는 Prisma Studio를 사용:
```bash
cd backend
npx prisma studio
# http://localhost:5555 에서 InvitationCode 테이블에 레코드 추가
```

---

## 테스트 실행

### 백엔드 (Jest + ts-jest)

```bash
cd backend

npm test                                    # 전체 테스트
npm test -- src/services/authService.test.ts  # 단일 파일
npm test -- -t "login"                       # 이름으로 필터
npm run test:watch                           # Watch 모드
npm test -- --coverage                       # 커버리지
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

```bash
cd frontend
npx tsc --noEmit    # 타입 검사
```

---

## 개발 명령어 요약

### 백엔드

```bash
npm run dev                            # 개발 서버 (nodemon + ts-node)
npm run build                          # TypeScript 컴파일
npm start                              # 프로덕션 서버
npm test                               # Jest 테스트
npm run lint                           # ESLint
npx tsc --noEmit                       # 타입 검사
npx prisma studio                      # DB GUI (http://localhost:5555)
npx prisma migrate dev --name <name>   # 마이그레이션

# Docker
docker-compose up -d --build           # 전체 빌드 및 실행
docker-compose down                    # 중지
docker-compose logs -f backend         # 로그 확인
```

### 프론트엔드

```bash
npx expo start                         # 개발 서버 (Expo Go)
npx expo start --dev-client             # 개발 서버 (Development Build)
npx expo start --ios                    # iOS 시뮬레이터
npx expo start --android                # Android 에뮬레이터
npx tsc --noEmit                        # 타입 검사

# EAS Build
eas build --profile development --platform ios           # iOS 시뮬레이터용
eas build --profile development-device --platform android # Android 실기기용 APK
eas build --profile preview --platform android            # 배포용 APK
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
| Docker 컨테이너화 | 백엔드 + DB 일관된 환경, 배포 간소화 |
| expo-dev-client | Expo Go의 네이티브 모듈 제한 해결 |
| Threads 스타일 레이아웃 | 2-column 구조로 아바타와 콘텐츠 분리, 가독성 향상 |
| 이미지 자동 압축 | 업로드 전 리사이징/JPEG 변환으로 네트워크 부하 감소 |

---

## 알려진 이슈 및 TODO

- [x] 푸시 알림 연동 (expo-notifications)
- [x] EAS Build 설정 (development, preview 프로필)
- [x] 백엔드 Docker 컨테이너화
- [x] 프로필 이미지 확대 보기
- [x] 블랙/화이트 컬러 스킴 적용
- [x] Threads 스타일 2-column 레이아웃
- [x] 게시물 액션 시트 (좋아요/댓글/삭제)
- [x] 홈 상단 compose prompt
- [x] 기본 아바타 person 아이콘 통일
- [ ] NAS 배포 설정 (Nginx 리버스 프록시)
- [ ] Admin UI 화면 구현 (웹 또는 앱 내)
- [ ] 댓글/답글에 좋아요 UI 추가
- [ ] 동영상 재생 UI 개선
- [ ] 게시물 수정 기능 프론트엔드 구현
- [ ] 게시물 상세 페이지 2-column 레이아웃 적용
