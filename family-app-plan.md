# 가족용 폐쇄형 SNS 앱 - 종합 개발 계획서

**프로젝트명**: Family Threads  
**개발 기간**: 1개월 (2026년 2월 ~ 3월)  
**팀**: 개발자 1명  
**최종 배포**: iOS + Android (React Native + Expo)

---

## 1. 프로젝트 개요

### 1.1 목표
4명의 가족 구성원들이 폐쇄된 SNS 환경에서 사진, 동영상, 글을 공유하고 소통할 수 있는 모바일 앱 개발

### 1.2 주요 특징
- **폐쇄형 SNS**: 가족 4명만 접근 가능
- **초대 코드 기반 회원가입**: 보안 강화
- **관리자 시스템**: 개발자(1명)만 관리자 권한
- **풍부한 미디어 지원**: 사진, GIF, 동영상 모두 지원
- **실시간 알림**: 푸시 알림을 통한 빠른 소통
- **전용 서버**: 개인 NAS 기반 저장소 (비용 0원)

### 1.3 범위 (MVP)
✅ 회원가입 / 로그인 (초대코드 + 아이디/비밀번호)  
✅ 글 작성 / 수정 / 삭제 (+ 미디어 첨부)  
✅ 홈 피드 (최신 글 먼저 표시)  
✅ 검색 (월별 + 태그 + 텍스트)  
✅ 댓글 / 좋아요  
✅ 활동 탭 (댓글, 좋아요, 알림 히스토리)  
✅ 프로필 (내 글, 답글, 미디어 탭)  
✅ 푸시 알림 (iOS + Android)  
✅ 관리자 기능 (사용자/콘텐츠 관리 기본)

---

## 2. 기능 명세

### 2.1 네비게이션 (하단 탭바 - 5개)

#### 탭 1: 홈 (Home)
- **기능**: 최신 글 시간순 정렬로 피드 표시
- **콘텐츠**: 
  - 작성자 정보 (프로필 사진, 닉네임, 작성 시간)
  - 글 본문
  - 미디어 (사진/GIF/동영상) - 1개 이상 가능
  - 태그 표시
  - 좋아요 수, 댓글 수
  - 좋아요 / 댓글 버튼
- **상호작용**: 좋아요 토글, 댓글 작성 가능
- **특수**: 자신의 글에 한해 메뉴 (수정/삭제) 제공

#### 탭 2: 검색 (Search)
- **구조**: 
  - 상단 검색바 (텍스트 검색)
  - 월별 구분 (2026년 2월, 1월, 2025년 12월, ...)
- **표시 방식**: 사진 갤러리 레이아웃 (이미지 먼저 보이기)
- **검색 대상**:
  - 글 본문 텍스트
  - 태그
  - 작성자
- **필터**: 월별, 미디어 타입 (사진/GIF/동영상 구분)

#### 탭 3: 작성 (+)
- **UI**: 모달 또는 새 화면 진입
- **필드**:
  - 본문 입력창 (제목 없음, 본문만)
  - 태그 입력 (선택)
  - 미디어 첨부 버튼
    - 갤러리에서 선택 (사진/GIF/동영상)
    - 여러 개 첨부 가능
  - 게시 버튼
- **특수 기능**: 
  - 알림 수신자 선택 팝업
    - 가족 구성원 선택 (체크박스)
    - 선택된 사람에게 푸시 알림 + 메시지 입력
    - "이 포스트에 대해 알림받기" 옵션

#### 탭 4: 활동 (Activity)
- **섹션 분류**:
  - **좋아요**: 내 글에 누가 좋아요를 눌렀는지
  - **댓글**: 내 글에 달린 댓글 + 내 댓글에 달린 답글
  - **알림**: 다른 사람이 보낸 알림 메시지 (별도로 받은 알림들)
- **각 항목**: 액션 유저, 액션 타입, 시간, 해당 글 미리보기
- **상호작용**: 항목 클릭 시 해당 글로 이동

#### 탭 5: 프로필 (Profile)
- **섹션**:
  - **프로필 헤더**
    - 프로필 사진 (업로드 가능)
    - 닉네임
    - 아이디
    - "프로필 편집" 버튼
  - **통계**: 글 수, 댓글 수, 좋아요 받은 수
  - **피드 탭** (아래 3개 탭)
    - **내 글**: 내가 작성한 모든 글
    - **답글**: 내가 작성한 댓글 (+ 원글 미리보기)
    - **미디어**: 내가 올린 모든 미디어 (갤러리 형식)

### 2.2 상세 기능

#### 2.2.1 회원 시스템
- **초대 코드 기반 회원가입**
  - 관리자가 발급한 초대 코드 입력
  - 초대 코드 유효 기간 설정 (선택)
  - 중복 사용 방지
- **회원가입 절차**
  1. 초대 코드 입력
  2. 아이디 입력 (중복 체크)
  3. 비밀번호 설정
  4. 닉네임 설정
  5. 프로필 사진 (선택)
- **로그인**
  - 아이디 + 비밀번호
  - JWT 토큰 발급 (자동 갱신)
  - 로그아웃 기능

#### 2.2.2 글 (Thread) 관리
- **작성**
  - 본문 (필수)
  - 미디어 첨부 (선택, 여러 개 가능)
    - 타입: 사진 (JPEG, PNG), GIF, 동영상 (MP4, MOV)
    - Threads 기준 용량 제한 (보통 100MB/파일)
  - 태그 (선택, 여러 개)
  - 알림 수신자 선택 + 메시지
- **수정**: 본문 + 태그만 수정 (미디어는 불가)
- **삭제**: 본인 글 또는 관리자만 가능
- **조회**: 글 상세 페이지 (댓글 목록 포함)

#### 2.2.3 댓글 시스템
- **작성**: 글에 댓글 추가
- **답글**: 댓글에 대한 답글 (1단계)
- **수정/삭제**: 본인 또는 관리자만
- **좋아요**: 댓글에도 좋아요 가능

#### 2.2.4 좋아요
- **대상**: 글, 댓글
- **기능**: 토글 (누르면 좋아요, 다시 누르면 취소)
- **조회**: 활동 탭에서 "좋아요 받은 항목" 확인

#### 2.2.5 알림 (Notification)
- **타입**:
  - 글 작성 시 특정 사람에게 보내는 "맞춤 알림"
  - 댓글/좋아요 자동 알림
- **푸시 알림**
  - iOS: APNs
  - Android: FCM
- **인앱 알림**: 활동 탭에 히스토리 저장

#### 2.2.6 태그 시스템
- **생성**: 글 작성 시 해시태그 추가 (#여행, #가족, #일상, ...)
- **검색**: 검색 탭에서 태그로 필터링
- **자동완성**: 기존 태그 목록 제시

#### 2.2.7 관리자 기능 (개발자만)
- **사용자 관리**
  - 초대 코드 발급 / 회수
  - 사용자 권한 관리
  - 사용자 정보 조회
- **콘텐츠 관리**
  - 모든 글 / 댓글 삭제 권한
  - 부적절한 콘텐츠 처리

---

## 3. 기술 스택

### 3.1 프론트엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | React Native |
| 런타임 | Expo |
| 언어 | TypeScript |
| 네비게이션 | Expo Router |
| 상태관리 | Zustand |
| API 통신 | Axios |
| 폼 관리 | React Hook Form |
| 이미지 캐싱 | React Native Image Cache |
| 푸시 알림 | Expo Notifications |
| 파일 선택 | Expo Image Picker, Expo Video |

### 3.2 백엔드
| 항목 | 기술 |
|------|------|
| 런타임 | Node.js |
| 프레임워크 | Express.js |
| 언어 | TypeScript |
| 인증 | JWT (jsonwebtoken) |
| 데이터베이스 | PostgreSQL |
| ORM | TypeORM 또는 Prisma |
| 파일 업로드 | Multer |
| 이미지 처리 | Sharp (리사이징) |
| 비디오 처리 | FFmpeg (선택사항, MVP에서는 제외) |
| 푸시 알림 | Expo Server SDK |
| Validation | Joi 또는 class-validator |
| 로깅 | Winston 또는 Pino |
| CORS | cors |
| 환경변수 | dotenv |

### 3.3 데이터베이스
| 항목 | 기술 |
|------|------|
| DB | PostgreSQL 14+ |
| 호스팅 | 개인 NAS (Docker 컨테이너 또는 직설치) |
| 백업 | 정기 백업 전략 (주 1회 권장) |

### 3.4 인프라 & 배포
| 항목 | 기술 |
|------|------|
| 서버 | NAS (Docker 또는 직설치 Express) |
| 미디어 저장소 | NAS 내 전용 폴더 (/media/uploads) |
| 네트워크 | 집 와이파이 + 모바일 데이터 (VPN 또는 포트포워딩) |
| 앱 배포 | EAS Build (Expo) |

---

## 4. 시스템 아키텍처

### 4.1 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native + Expo (Frontend)              │
│                  (Zustand, Expo Router, Axios)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ (REST API + WebSocket)
                           │ HTTP/HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Express.js Backend (Node.js)                  │
│  (JWT Auth, File Upload, Business Logic, API Endpoints)        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes (Auth, Posts, Comments, Likes, Notifications)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware (Auth, Error Handling, Validation)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services (Business Logic)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────────┐  ┌────────────────────┐
│  PostgreSQL DB    │  │  NAS File Storage  │
│  (on NAS)         │  │  (/media/uploads)  │
│                   │  │                    │
│ - Users           │  │ - Photos           │
│ - Posts           │  │ - GIFs             │
│ - Comments        │  │ - Videos           │
│ - Likes           │  │ - Thumbnails       │
│ - Notifications   │  │                    │
│ - Tags            │  │                    │
└───────────────────┘  └────────────────────┘
```

### 4.2 통신 흐름

#### 4.2.1 인증 플로우
```
1. 초대코드 입력 (선택적 검증)
   └─> POST /auth/register/validate-code
   
2. 회원가입
   └─> POST /auth/register
   └─> Response: { accessToken, refreshToken, user }
   
3. 로그인
   └─> POST /auth/login
   └─> Response: { accessToken, refreshToken, user }
   
4. 토큰 갱신 (accessToken 만료 시)
   └─> POST /auth/refresh
   └─> Response: { accessToken }
```

#### 4.2.2 글 작성 + 알림 플로우
```
1. 글 + 미디어 업로드
   └─> POST /posts (multipart/form-data)
   └─> Files 저장 → NAS
   └─> Post 레코드 생성 → PostgreSQL
   
2. 알림 수신자 선택 + 메시지 입력
   └─> Notification 레코드 생성
   └─> Expo Server SDK로 푸시 알림 발송
   └─> 수신 앱: Expo Notifications 핸들러
   
3. 응답
   └─> POST /notifications
   └─> Response: { postId, notificationId }
```

#### 4.2.3 검색 플로우
```
1. 텍스트 검색
   └─> GET /posts/search?q=keyword
   └─> DB 쿼리: 글 본문, 태그, 작성자 검색
   
2. 월별 필터
   └─> GET /posts?month=202602
   └─> DB 쿼리: created_at 범위로 필터
   
3. 미디어 타입 필터
   └─> GET /posts?mediaType=photo|gif|video
   └─> DB 쿼리: media_type으로 필터
```

---

## 5. API 설계 (REST Endpoints)

### 5.1 인증 (Auth)
```
POST   /auth/register/validate-code     초대코드 검증
POST   /auth/register                   회원가입
POST   /auth/login                      로그인
POST   /auth/logout                     로그아웃
POST   /auth/refresh                    토큰 갱신
POST   /auth/password-change            비밀번호 변경
```

### 5.2 사용자 (Users)
```
GET    /users/:userId                   사용자 정보 조회
PUT    /users/:userId                   사용자 정보 수정 (프로필 사진, 닉네임)
GET    /users/:userId/posts             사용자의 글 목록
GET    /users/:userId/comments          사용자의 댓글 목록
GET    /users/:userId/media             사용자의 미디어 목록
GET    /users/me                        현재 로그인한 사용자 정보
```

### 5.3 글 (Posts)
```
GET    /posts                           글 목록 (최신순, 페이지네이션)
POST   /posts                           글 작성 (multipart/form-data)
GET    /posts/:postId                   글 상세 조회
PUT    /posts/:postId                   글 수정 (본문, 태그)
DELETE /posts/:postId                   글 삭제
GET    /posts/search                    글 검색 (텍스트, 태그, 월별)
GET    /posts/tag/:tagName              특정 태그의 글 목록
```

### 5.4 댓글 (Comments)
```
POST   /posts/:postId/comments          댓글 작성
GET    /posts/:postId/comments          댓글 목록 (트리 구조 또는 플랫)
PUT    /comments/:commentId             댓글 수정
DELETE /comments/:commentId             댓글 삭제
POST   /comments/:commentId/replies     답글 작성
```

### 5.5 좋아요 (Likes)
```
POST   /posts/:postId/likes             글에 좋아요
DELETE /posts/:postId/likes             글 좋아요 취소
POST   /comments/:commentId/likes       댓글에 좋아요
DELETE /comments/:commentId/likes       댓글 좋아요 취소
GET    /posts/:postId/likes             글에 좋아요한 사람 목록
GET    /comments/:commentId/likes       댓글에 좋아요한 사람 목록
```

### 5.6 알림 (Notifications)
```
POST   /posts/:postId/notify            특정 글에 알림 (푸시)
GET    /notifications                   알림 목록
GET    /notifications/unread            읽지 않은 알림
PUT    /notifications/:notificationId   알림 읽음 표시
DELETE /notifications/:notificationId   알림 삭제
POST   /notifications/register-token    FCM/APNs 토큰 등록
```

### 5.7 활동 (Activity)
```
GET    /activity/likes                  받은 좋아요
GET    /activity/comments               받은 댓글
GET    /activity/notifications          받은 알림
GET    /activity                        전체 활동 (통합)
```

### 5.8 태그 (Tags)
```
GET    /tags                            모든 태그 목록 (자동완성)
GET    /tags/popular                    인기 태그
GET    /tags/:tagName/posts             특정 태그의 글
```

### 5.9 관리자 (Admin)
```
POST   /admin/invitation-codes          초대코드 생성
GET    /admin/invitation-codes          초대코드 목록
DELETE /admin/invitation-codes/:code    초대코드 삭제
GET    /admin/users                     모든 사용자 목록
PUT    /admin/users/:userId/role        사용자 역할 변경
DELETE /admin/users/:userId             사용자 삭제
GET    /admin/posts                     모든 글 관리
DELETE /admin/posts/:postId             글 삭제 (관리)
GET    /admin/statistics                통계
```

---

## 6. 데이터베이스 스키마 (PostgreSQL)

### 6.1 테이블 구조

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  profile_image_url VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### invitation_codes
```sql
CREATE TABLE invitation_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id),
  used_by INTEGER REFERENCES users(id),
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### posts
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

#### post_media
```sql
CREATE TABLE post_media (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_type ENUM('photo', 'gif', 'video') NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  duration INTEGER, -- for videos, in seconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  position INTEGER -- order in post
);
```

#### tags
```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### post_tags
```sql
CREATE TABLE post_tags (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id)
);
```

#### comments
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

#### likes
```sql
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id, comment_id) -- 같은 글/댓글에 중복 방지
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type ENUM('post_mention', 'comment', 'like', 'custom') DEFAULT 'custom',
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  expo_push_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);
```

#### push_tokens
```sql
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  device_type ENUM('ios', 'android') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, token)
);
```

### 6.2 인덱스 (성능 최적화)
```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
```

### 6.3 관계도

```
users (1) ──────────── (N) posts
        └─ (1) ──────── (N) comments
        └─ (1) ──────── (N) likes
        └─ (1) ──────── (N) notifications (sender)
        
posts (1) ──────────── (N) comments
        └─ (1) ──────── (N) post_media
        └─ (1) ──────── (N) likes
        └─ (1) ──────── (N) post_tags
        └─ (1) ──────── (N) notifications
        
comments (1) ─────────── (N) comments (parent-child)
          └─ (1) ─────── (N) likes
          
tags (1) ──────────── (N) post_tags
       └─ (1) ─────── (N) posts
```

---

## 7. 개발 로드맵 (1개월)

### Phase 1: 초기 설정 (1주)
**목표**: 개발 환경 및 기본 구조 완성

- [ ] PostgreSQL 설정 (NAS에 Docker 또는 직설치)
- [ ] Express 프로젝트 생성 + TypeScript 설정
- [ ] React Native + Expo 프로젝트 생성
- [ ] DB 마이그레이션 스크립트 작성
- [ ] 프로젝트 폴더 구조 정리
- [ ] Git 저장소 설정
- [ ] 환경 변수 (.env) 구성

**산출물**: 개발 환경 완성, DB 스키마 적용, 기본 프로젝트 구조

---

### Phase 2: 백엔드 기본 (1.5주)
**목표**: 인증 시스템 + 기본 API 완성

#### Week 2
- [ ] JWT 인증 시스템 구축
  - 초대코드 생성 / 검증 API
  - 회원가입 API
  - 로그인 / 토큰 갱신 API
  - 인증 미들웨어
- [ ] 사용자 관리 API
  - 프로필 조회 / 수정
  - 프로필 사진 업로드 (Multer)
- [ ] 파일 업로드 시스템 (Multer)
  - NAS 경로 설정
  - 파일 검증 (타입, 크기)
  - 파일 저장 로직

#### Week 3 (초반)
- [ ] 글 작성 / 수정 / 삭제 API
- [ ] 글 조회 API (목록, 상세)
- [ ] 댓글 CRUD API
- [ ] 좋아요 토글 API

**산출물**: 인증 시스템 완성, 글/댓글/좋아요 API 완성

---

### Phase 3: 백엔드 심화 (1.5주)
**목표**: 검색, 태그, 알림 시스템

#### Week 3 (중반) ~ Week 4
- [ ] 검색 API
  - 텍스트 검색 (글 본문, 태그)
  - 월별 필터
  - 미디어 타입 필터
- [ ] 태그 시스템
  - 태그 생성 / 조회
  - 자동완성 API
  - 인기 태그 API
- [ ] 푸시 알림 시스템
  - FCM / APNs 통합
  - Expo Server SDK 연동
  - 알림 저장 / 조회 API
- [ ] 활동 피드 API
  - 받은 좋아요, 댓글, 알림 통합 조회
- [ ] 관리자 API (기본)
  - 초대코드 관리
  - 사용자 관리
  - 콘텐츠 관리

**산출물**: 전체 백엔드 API 완성, 테스트 코드 작성

---

### Phase 4: 프론트엔드 기본 (1.5주)
**목표**: 네비게이션 + 인증 화면

#### Week 2 ~ Week 3 (초반)
- [ ] Expo Router 네비게이션 구조
  - 하단 탭바 (5개 탭)
  - 스택 네비게이션
- [ ] 인증 화면
  - 초대코드 입력 화면
  - 회원가입 화면
  - 로그인 화면
- [ ] Zustand 상태 관리 설정
  - 사용자 상태
  - 인증 상태
  - API 캐시
- [ ] HTTP 클라이언트 (Axios) 설정
  - 인터셉터 (토큰 자동 갱신)
  - 에러 핸들링

**산출물**: 네비게이션 + 인증 시스템 UI 완성

---

### Phase 5: 프론트엔드 피드 & 작성 (1주)
**목표**: 홈 피드 + 글 작성 기능

#### Week 4
- [ ] 홈 피드 화면
  - 글 목록 조회
  - 최신순 정렬
  - 무한 스크롤 / 페이지네이션
  - 좋아요 토글
  - 댓글 버튼
- [ ] 글 작성 모달/화면
  - 본문 입력
  - 미디어 선택 (갤러리)
  - 태그 입력
  - 알림 수신자 선택
  - 게시 버튼
- [ ] 글 상세 화면
  - 글 정보
  - 댓글 목록
  - 댓글 작성

**산출물**: 홈 피드 + 글 작성 완성

---

### Phase 6: 프론트엔드 검색 & 활동 (1주)
**목표**: 검색 탭 + 활동 탭 + 프로필

#### Week 4 (후반)
- [ ] 검색 화면
  - 검색바
  - 월별 구분
  - 갤러리 레이아웃 (사진 먼저)
  - 필터 (미디어 타입)
- [ ] 활동 탭
  - 좋아요 목록
  - 댓글 목록
  - 알림 목록
- [ ] 프로필 화면
  - 프로필 헤더 (사진, 닉네임, 통계)
  - 내 글 탭
  - 답글 탭
  - 미디어 탭

**산출물**: 검색 + 활동 + 프로필 완성

---

### Phase 7: 푸시 알림 & 테스트 (1주)
**목표**: 푸시 알림 시스템 + 통합 테스트

#### Week 5
- [ ] Expo Notifications 설정
  - FCM 토큰 등록 (Android)
  - APNs 토큰 등록 (iOS)
  - 푸시 알림 수신 핸들러
  - 알림 클릭 → 해당 글로 이동
- [ ] 전체 통합 테스트
  - 회원가입 ~ 글 작성 ~ 댓글 ~ 알림
  - 각 탭 정상 동작
  - 검색 기능
  - 프로필 기능
- [ ] 버그 수정
- [ ] 성능 최적화 (이미지 캐싱, 무한 스크롤 최적화)

**산출물**: 완전히 동작하는 앱

---

### Phase 8: 배포 & 최종 (1주)
**목표**: iOS/Android 배포

- [ ] EAS Build 설정
  - iOS 빌드 (TestFlight)
  - Android 빌드 (Google Play)
- [ ] 최종 테스트 (4명의 가족)
- [ ] 버그 수정
- [ ] 앱스토어 / 플레이스토어 제출 (선택, 비공개 배포 가능)
- [ ] 서버 최적화 (NAS 백업, 모니터링)

**산출물**: 배포 완료

---

## 8. 백엔드 개발 가이드

### 8.1 Express 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL 연결
│   │   ├── multer.ts           # 파일 업로드 설정
│   │   ├── jwt.ts              # JWT 설정
│   │   └── environment.ts       # 환경 변수
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── postController.ts
│   │   ├── commentController.ts
│   │   ├── userController.ts
│   │   ├── notificationController.ts
│   │   ├── searchController.ts
│   │   ├── tagController.ts
│   │   └── adminController.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   ├── comments.ts
│   │   ├── users.ts
│   │   ├── notifications.ts
│   │   ├── search.ts
│   │   ├── tags.ts
│   │   ├── admin.ts
│   │   └── index.ts             # 라우트 통합
│   ├── middleware/
│   │   ├── auth.ts              # JWT 검증
│   │   ├── errorHandler.ts      # 에러 핸들링
│   │   ├── validation.ts        # 입력 검증
│   │   └── admin.ts             # 관리자 권한 검증
│   ├── services/
│   │   ├── authService.ts
│   │   ├── postService.ts
│   │   ├── commentService.ts
│   │   ├── userService.ts
│   │   ├── notificationService.ts
│   │   ├── searchService.ts
│   │   ├── tagService.ts
│   │   └── fileService.ts
│   ├── models/ (or entities/ if using TypeORM)
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   ├── Comment.ts
│   │   ├── Like.ts
│   │   ├── Notification.ts
│   │   ├── Tag.ts
│   │   ├── InvitationCode.ts
│   │   └── PostMedia.ts
│   ├── types/
│   │   ├── express.d.ts         # Express 타입 확장
│   │   ├── api.ts               # API 응답 타입
│   │   └── database.ts          # DB 모델 타입
│   ├── utils/
│   │   ├── logger.ts            # 로깅
│   │   ├── errors.ts            # 커스텀 에러
│   │   ├── jwt.ts               # JWT 유틸
│   │   └── file.ts              # 파일 유틸
│   ├── migrations/
│   │   ├── 001_init.ts
│   │   ├── 002_create_users.ts
│   │   └── ...
│   └── app.ts                   # Express 앱 설정
├── .env                         # 환경 변수
├── .env.example
├── package.json
├── tsconfig.json
├── docker-compose.yml           # PostgreSQL Docker (선택)
└── README.md
```

### 8.2 주요 설정 파일

#### package.json 기본 의존성
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.9.0",
    "prisma": "^5.0.0",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "joi": "^17.9.0",
    "winston": "^3.8.0",
    "sharp": "^0.32.0",
    "expo-server-sdk": "^3.7.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

#### 기본 app.ts 구조
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import errorHandler from './middleware/errorHandler';

dotenv.config();

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
// ... 다른 라우트

// 에러 핸들링
app.use(errorHandler);

export default app;
```

### 8.3 핵심 구현 패턴

#### JWT 인증 미들웨어
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### 파일 업로드 설정 (Multer)
```typescript
// config/multer.ts
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/path/to/nas/media/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // MIME 타입 검증
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/quicktime'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

#### 글 작성 API
```typescript
// controllers/postController.ts
import { Request, Response } from 'express';
import { createPost } from '../services/postService';

export const createPostHandler = async (req: Request, res: Response) => {
  try {
    const { content, tags, notifyUsers, notifyMessage } = req.body;
    const userId = req.userId;
    const files = req.files as Express.Multer.File[];
    
    const post = await createPost({
      userId,
      content,
      tags: tags ? JSON.parse(tags) : [],
      files,
      notifyUsers: notifyUsers ? JSON.parse(notifyUsers) : [],
      notifyMessage
    });
    
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

## 9. 프론트엔드 개발 가이드

### 9.1 React Native + Expo 프로젝트 구조

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── invite-code.tsx       # 초대코드 입력
│   │   ├── register.tsx          # 회원가입
│   │   ├── login.tsx             # 로그인
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # 홈 피드
│   │   ├── search.tsx            # 검색
│   │   ├── create.tsx            # + (글 작성)
│   │   ├── activity.tsx          # 활동
│   │   ├── profile.tsx           # 프로필
│   │   └── _layout.tsx
│   ├── [postId]/
│   │   ├── index.tsx             # 글 상세
│   │   └── comments.tsx          # 댓글 목록
│   ├── [userId]/
│   │   └── profile.tsx           # 다른 사용자 프로필
│   └── _layout.tsx               # 루트 레이아웃
├── src/
│   ├── stores/
│   │   ├── authStore.ts          # 인증 상태 (Zustand)
│   │   ├── feedStore.ts          # 피드 상태
│   │   ├── userStore.ts          # 사용자 상태
│   │   └── notificationStore.ts  # 알림 상태
│   ├── services/
│   │   ├── api.ts                # Axios 설정
│   │   ├── authService.ts
│   │   ├── postService.ts
│   │   ├── commentService.ts
│   │   ├── notificationService.ts
│   │   ├── searchService.ts
│   │   └── uploadService.ts
│   ├── components/
│   │   ├── PostCard.tsx          # 글 카드
│   │   ├── CommentItem.tsx       # 댓글 아이템
│   │   ├── ImagePicker.tsx       # 이미지/비디오 선택
│   │   ├── TagInput.tsx          # 태그 입력
│   │   ├── TabBar.tsx            # 하단 탭바
│   │   ├── ProfileHeader.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── usePosts.ts           # 글 조회
│   │   ├── useAuth.ts            # 인증
│   │   ├── useNotifications.ts   # 알림
│   │   └── useSearch.ts          # 검색
│   ├── types/
│   │   ├── api.ts                # API 응답 타입
│   │   ├── models.ts             # 데이터 모델 타입
│   │   └── index.ts
│   ├── utils/
│   │   ├── date.ts               # 날짜 포맷
│   │   ├── validation.ts         # 검증
│   │   ├── constants.ts          # 상수
│   │   └── logger.ts
│   └── config/
│       ├── api.config.ts         # API 엔드포인트
│       └── constants.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── .env
├── .env.example
├── app.json                      # Expo 설정
├── package.json
├── tsconfig.json
└── README.md
```

### 9.2 Zustand 스토어 예시

#### authStore.ts
```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoggedIn: false,
  login: async (credentials) => {
    // API 호출
    const response = await api.post('/auth/login', credentials);
    set({
      user: response.data.user,
      accessToken: response.data.accessToken,
      isLoggedIn: true
    });
  },
  logout: () => {
    set({ user: null, accessToken: null, isLoggedIn: false });
  },
  register: async (data) => {
    // API 호출
  }
}));
```

### 9.3 API 서비스 예시

#### api.ts
```typescript
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터 (토큰 갱신)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 갱신 로직
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 9.4 Expo Router 네비게이션

#### app/_layout.tsx (루트)
```typescript
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function RootLayout() {
  const { isLoggedIn } = useAuthStore();
  
  return (
    <Stack>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}
```

#### app/(tabs)/_layout.tsx (탭 네비게이션)
```typescript
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="create" options={{ title: '+' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

### 9.5 핵심 컴포넌트 패턴

#### PostCard.tsx
```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface PostCardProps {
  post: Post;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment
}) => {
  return (
    <View style={{ padding: 12, borderBottomWidth: 1 }}>
      {/* 작성자 정보 */}
      <View style={{ marginBottom: 12, flexDirection: 'row' }}>
        <Image
          source={{ uri: post.user.profileImageUrl }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>{post.user.nickname}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {/* 글 본문 */}
      <Text style={{ marginBottom: 12 }}>{post.content}</Text>
      
      {/* 미디어 */}
      {post.media && post.media.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          {post.media.map((m) => (
            <Image
              key={m.id}
              source={{ uri: m.fileUrl }}
              style={{ width: '100%', height: 300, marginBottom: 8 }}
            />
          ))}
        </View>
      )}
      
      {/* 액션 버튼 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <TouchableOpacity onPress={() => onLike(post.id)}>
          <Text>❤️ {post.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onComment(post.id)}>
          <Text>💬 {post.commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

---

## 10. 배포 및 운영

### 10.1 서버 환경 (NAS)

#### PostgreSQL 설치 (Docker 권장)
```bash
docker run --name postgres-family-app \
  -e POSTGRES_USER=family_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=family_app \
  -v /volume1/docker/postgres:/var/lib/postgresql/data \
  -p 5432:5432 \
  -d postgres:15
```

#### Express 서버 배포 (NAS에서 Node.js 실행)
```bash
# NAS에 Node.js 설치 (Synology의 경우 Package Center에서 Node.js 설치)
# 프로젝트 클론
git clone <your-repo>
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# PM2로 서버 실행 (재시작 시 자동 시작)
npm install -g pm2
pm2 start npm --name "family-app-api" -- start
pm2 startup
pm2 save
```

### 10.2 파일 저장소 (NAS)

```
/volume1/family-app/
├── media/
│   ├── uploads/
│   │   ├── posts/
│   │   │   └── {postId}/
│   │   │       ├── image-1.jpg
│   │   │       ├── image-2.jpg
│   │   │       └── video-1.mp4
│   │   └── profiles/
│   │       └── {userId}/
│   │           └── profile.jpg
│   ├── thumbnails/    # 썸네일 캐시 (선택)
│   └── temp/          # 임시 파일
└── backups/
    └── db-{date}.sql
```

### 10.3 모니터링 & 백업

#### 정기 백업
```bash
# cron 스케줄: 주 1회 (일요일 새벽 2시)
0 2 * * 0 pg_dump -U family_user family_app > /volume1/family-app/backups/db-$(date +\%Y\%m\%d).sql
```

#### 로그 모니터링
```bash
pm2 logs family-app-api
```

### 10.4 환경 변수 (.env)

```env
# 서버
NODE_ENV=production
PORT=3000

# 데이터베이스
DATABASE_URL=postgresql://family_user:password@localhost:5432/family_app

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=1h

# 파일 업로드
UPLOAD_DIR=/volume1/family-app/media/uploads
MAX_FILE_SIZE=104857600

# Expo 푸시 알림
EXPO_ACCESS_TOKEN=your-expo-access-token

# CORS
FRONTEND_URL=app://localhost
```

---

## 11. 개발 체크리스트

### Phase 1: 초기 설정
- [ ] PostgreSQL 설정 및 스키마 생성
- [ ] Express + TypeScript 프로젝트 생성
- [ ] React Native + Expo 프로젝트 생성
- [ ] 폴더 구조 생성
- [ ] 환경 변수 설정 (.env)
- [ ] Git 저장소 초기화

### Phase 2: 백엔드 인증
- [ ] JWT 인증 시스템
- [ ] 초대코드 API
- [ ] 회원가입 API
- [ ] 로그인 API
- [ ] 토큰 갱신 API
- [ ] 프로필 조회/수정 API

### Phase 3: 백엔드 핵심 기능
- [ ] 글 CRUD API
- [ ] 댓글 CRUD API
- [ ] 좋아요 토글 API
- [ ] 파일 업로드 시스템
- [ ] 검색 API
- [ ] 태그 시스템

### Phase 4: 백엔드 고급 기능
- [ ] 알림 API
- [ ] 활동 피드 API
- [ ] 관리자 기능
- [ ] API 테스트

### Phase 5: 프론트엔드 네비게이션
- [ ] Expo Router 네비게이션
- [ ] 하단 탭바
- [ ] 인증 화면 (회원가입, 로그인)
- [ ] Zustand 상태관리
- [ ] Axios 설정

### Phase 6: 프론트엔드 피드
- [ ] 홈 피드 화면
- [ ] PostCard 컴포넌트
- [ ] 글 작성 모달
- [ ] 댓글 기능

### Phase 7: 프론트엔드 나머지
- [ ] 검색 화면
- [ ] 활동 탭
- [ ] 프로필 탭
- [ ] 무한 스크롤

### Phase 8: 푸시 알림 & 배포
- [ ] Expo Notifications 설정
- [ ] FCM / APNs 토큰 등록
- [ ] 푸시 알림 수신 처리
- [ ] 전체 테스트
- [ ] EAS Build 설정
- [ ] iOS/Android 빌드 및 배포

---

## 12. 참고 자료 & 팁

### 추천 라이브러리
- **상태관리**: Zustand (가볍고 직관적)
- **폼 관리**: React Hook Form (성능 최적화)
- **이미지 캐싱**: React Native Image Cache
- **HTTP 클라이언트**: Axios (인터셉터 우수)
- **로깅**: Winston (Node.js) / react-native-logs (RN)
- **환경변수**: dotenv (Node) / @react-native-async-storage/async-storage (RN)

### 성능 최적화 팁
1. **이미지 최적화**
   - 썸네일 생성 (Sharp 사용)
   - 이미지 캐싱 (로컬 스토리지)
   - 비동기 로딩

2. **무한 스크롤**
   - 페이지네이션 (예: 20개씩)
   - 스켈레톤 로더
   - 중복 로딩 방지

3. **네트워크**
   - 요청 캐싱
   - 재시도 로직
   - 오프라인 모드 고려

4. **메모리**
   - 리스트 가상화 (FlatList의 initialNumToRender)
   - 이미지 메모리 관리

### 보안 팁
1. **인증**
   - 비밀번호 해싱 (bcryptjs)
   - JWT 서명
   - 토큰 만료 설정

2. **파일 업로드**
   - MIME 타입 검증
   - 파일 크기 제한
   - 바이러스 스캔 (선택)

3. **API**
   - Rate Limiting
   - SQL 인젝션 방지 (ORM 사용)
   - CORS 설정

---

## 13. FAQ & 트러블슈팅

### Q1: NAS에서 모바일로 접근하려면?
**A**: VPN(Tailscale), 포트포워딩, 또는 DDNS 사용. 별도 스레드에서 다룬다고 했으니 나중에!

### Q2: 푸시 알림이 안 오면?
**A**: 
- FCM/APNs 토큰이 제대로 저장되었는지 확인
- Expo Server SDK 인증 확인
- 모바일 앱의 알림 권한 확인

### Q3: 이미지 업로드가 느리면?
**A**:
- 이미지 압축 (Sharp)
- 청크 업로드 구현
- 백그라운드 업로드

### Q4: 데이터베이스가 느려지면?
**A**:
- 인덱스 추가
- 쿼리 최적화
- 데이터 아카이빙

---

## 마치며

이 계획서는 1달 안에 완전히 동작하는 가족용 SNS 앱을 만들기 위한 실질적인 로드맵입니다.

**핵심 포인트:**
- ✅ 1주일: 환경 설정
- ✅ 1.5주: 백엔드 기본 완성
- ✅ 1.5주: 백엔드 고급 기능
- ✅ 1주: 프론트엔드 UI 완성
- ✅ 1주: 통합 테스트 + 배포

각 Phase에서 막힐 때마다 이 문서를 참고하고, OpenCode + Claude Code에서 구체적인 코드를 작성하세요!

화이팅! 🚀

---

**작성일**: 2026년 2월 8일  
**버전**: 1.0  
**마지막 수정**: 2026년 2월 8일
