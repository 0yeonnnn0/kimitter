# Changelog

All notable changes to the Kimitter project will be documented in this file.

---

## [2026-02-09] - Bug Fixes & Network Configuration

### Fixed

#### 1. iOS Simulator Network Connection
- **Issue**: `Network Error` when accessing backend from iOS simulator
- **Cause**: iOS simulator treats `localhost` as itself, not the host machine
- **Solution**: Updated `frontend/.env` to use Mac's local IP (`192.168.219.51:3000`)
- **Files**: `frontend/.env`

#### 2. Photo Upload Timeout
- **Issue**: 15-second timeout causing large image upload failures
- **Solutions**:
  - Increased API timeout from 15s to 60s
  - Added automatic image compression before upload
    - Resize to max 1920px width
    - JPEG compression at 70% quality
    - Videos remain uncompressed
  - Fixed Multer field name mismatch (`files` → `media`)
  - Made `content` optional for photo-only posts
- **Files**: 
  - `frontend/src/services/api.ts`
  - `frontend/app/(tabs)/create.tsx`
  - `backend/src/routes/posts.ts`
  - `backend/src/validations/postValidation.ts`
- **Dependencies**: Added `expo-image-manipulator`

#### 3. Like Functionality
- **Issues**:
  - Like count not updating when clicked
  - No like UI on post detail screen
- **Root Cause**: Backend wasn't returning `isLiked` field per user
- **Solutions**:
  - **Backend**: Added `addIsLiked()` helper to inject user-specific like status
    - Modified `getPosts`, `getPostById`, `searchPosts` to include `isLiked`
    - All post endpoints now receive `userId` parameter
  - **Frontend**: 
    - Added `isLiked: boolean` to `Post` interface
    - Removed local like state, now using server data
    - Updated `feedStore.toggleLike` to handle `isLiked` in optimistic updates
    - Added like button UI to post detail screen
- **Files**:
  - `backend/src/services/postService.ts`
  - `backend/src/controllers/postController.ts`
  - `frontend/src/types/models.ts`
  - `frontend/src/stores/feedStore.ts`
  - `frontend/app/(tabs)/index.tsx`
  - `frontend/app/[postId]/index.tsx`

#### 4. Session Restoration Error Handling
- **Enhancement**: Added try/catch to `restoreSession` for graceful handling of corrupted tokens
- **Files**: `frontend/src/stores/authStore.ts`

### Verification
- ✅ All TypeScript type checks pass (`tsc --noEmit`)
- ✅ Backend server running on port 3000
- ✅ Backend unit tests: 58/58 passing
- ✅ iOS simulator app boots and connects successfully

---

## [2026-02-08] - Initial Development

### Added
- Complete backend API (Express + TypeScript + Prisma)
- React Native frontend (Expo + Expo Router)
- 11 database models (User, Post, Comment, Like, etc.)
- JWT authentication with refresh tokens
- File upload support (photos/videos/GIFs)
- Tag system
- Comment/reply system
- Notification system
- 58 unit tests for backend services
- Test accounts (admin/testuser)
- Development documentation (AGENTS.md, README.md)

### Infrastructure
- PostgreSQL 14 database
- Docker Compose for local DB
- Prisma ORM with migrations
- Multer for file uploads
- Winston logger
- Jest testing framework
