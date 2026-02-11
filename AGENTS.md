# AGENTS.md

> Guidelines for AI agents working in the Kimitter repository.

---

## Project Overview

**Kimitter** — Private family-only SNS app for 4 members. Invite-code-based registration, media sharing (photos/GIFs/video), push notifications, admin controls.

- **Language**: TypeScript (both frontend and backend)
- **Frontend**: React Native + Expo (Expo Router, Zustand, Axios)
- **Backend**: Node.js + Express.js (JWT auth, Multer uploads, Joi validation)
- **Database**: PostgreSQL 14+ (Prisma ORM)
- **Package Manager**: npm
- **Monorepo**: Yes — `frontend/` (Expo app) and `backend/` (Express API)

---

## Build / Run / Test Commands

### Backend (`backend/`)

| Action | Command |
|---|---|
| Install dependencies | `npm install` |
| Dev server | `npm run dev` (nodemon + ts-node) |
| Build | `npm run build` (tsc) |
| Start production | `npm start` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Run all tests | `npm test` |
| Run single test file | `npm test -- path/to/file.test.ts` |
| Run single test by name | `npm test -- -t "test name"` |
| DB migrate | `npx prisma migrate dev` |
| DB generate | `npx prisma generate` |

### Frontend (`frontend/`)

| Action | Command |
|---|---|
| Install dependencies | `npm install` |
| Dev server (Expo) | `npx expo start` |
| iOS simulator | `npx expo start --ios` |
| Android emulator | `npx expo start --android` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Run all tests | `npm test` |
| Run single test file | `npm test -- path/to/file.test.ts` |
| Run single test by name | `npm test -- -t "test name"` |
| EAS build (iOS) | `eas build --platform ios` |
| EAS build (Android) | `eas build --platform android` |

### Test Notes

- Test framework: Jest (both frontend and backend)
- Test files: co-located as `*.test.ts` / `*.test.tsx`
- Naming convention: `describe`/`it` blocks
- Backend integration tests may require a running PostgreSQL instance

---

## Code Style

### Formatting

- Indent: 2 spaces
- Semicolons: yes
- Quote style: single quotes
- Trailing commas: all (ES2017+)
- Max line length: 100

### Imports

```
1. Node built-ins (path, fs, crypto)
2. External packages (express, axios, zustand)
3. Internal aliases / absolute paths (../services/, ../stores/)
4. Relative imports (./utils, ./types)
```

- Blank line between groups: yes
- Default exports: avoid in backend; use named exports
- React components: default export is acceptable

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files / directories | camelCase (backend), PascalCase for components | `authService.ts`, `PostCard.tsx` |
| Variables / functions | camelCase | `getUserById`, `accessToken` |
| Interfaces / types | PascalCase | `PostCardProps`, `AuthState` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `JWT_EXPIRATION` |
| React components | PascalCase | `PostCard`, `TabBar` |
| Database tables / cols | snake_case | `post_media`, `created_at` |
| API routes | kebab-case, REST nouns | `/auth/password-change`, `/invitation-codes` |
| Zustand stores | `use{Name}Store` | `useAuthStore`, `useFeedStore` |

### Types

- Use `interface` for object shapes (props, API responses, store state)
- Use `type` for unions, intersections, and aliases
- Never use `any` — use `unknown` and narrow, or define a proper type
- Never use `@ts-ignore` or `@ts-expect-error`
- Co-locate types with their module; shared types go in `types/` directory
- API response types: wrap in `{ success: boolean; data: T }` pattern

### Error Handling

- **Backend**: Custom error classes in `src/utils/errors.ts` (AppError, NotFoundError, etc.)
- **Backend middleware**: Central `errorHandler` middleware catches all errors
- **Frontend**: Axios interceptors handle 401 (auto-refresh token) and network errors
- **Logging**: Winston (backend), console (frontend dev)
- **Never** write empty `catch(e) {}` blocks — always log or rethrow

---

## Project Structure

```
backend/
├── src/
│   ├── config/           # DB connection, Multer, JWT, env config
│   ├── controllers/      # Route handlers (thin — delegate to services)
│   ├── routes/           # Express route definitions
│   ├── middleware/        # auth, errorHandler, validation, admin
│   ├── services/         # Business logic layer
│   ├── models/           # Prisma schema lives at prisma/schema.prisma
│   ├── types/            # Shared TypeScript types (express.d.ts, api.ts)
│   ├── utils/            # Helpers (errors.ts, jwt.ts, logger.ts)
│   ├── migrations/       # Prisma migrations
│   └── app.ts            # Express app setup
├── .env / .env.example
├── package.json
├── tsconfig.json
└── docker-compose.yml    # PostgreSQL container

frontend/
├── app/                  # Expo Router file-based routing
│   ├── (auth)/           # Auth screens (invite-code, register, login)
│   ├── (tabs)/           # 5-tab layout (home, search, create, activity, profile)
│   ├── [postId]/         # Post detail + comments
│   └── _layout.tsx       # Root layout (auth gate)
├── src/
│   ├── stores/           # Zustand stores (auth, feed, user, notification)
│   ├── services/         # API service modules (axios-based)
│   ├── components/       # Shared UI components (PostCard, TagInput, etc.)
│   ├── hooks/            # Custom hooks (usePosts, useAuth, useSearch)
│   ├── types/            # Shared types (models.ts, api.ts)
│   ├── utils/            # Helpers (date, validation, constants)
│   └── config/           # API config, constants
├── assets/               # Images, fonts, icons
├── app.json              # Expo config
├── package.json
└── tsconfig.json
```

---

## Key Patterns & Conventions

### Architecture

- **State management**: Zustand (lightweight stores, no Redux boilerplate)
- **Data fetching**: Axios with interceptors for token refresh
- **API layer**: REST, Express routes under `/api/*`
- **Auth**: JWT (access + refresh tokens), invite-code gated registration
- **Database**: PostgreSQL via Prisma ORM
- **File storage**: NAS local filesystem (`/media/uploads/`)

### Backend Patterns

- **Controller → Service → Prisma**: Controllers are thin; business logic lives in services
- **Route files**: group endpoints by resource (`routes/posts.ts`, `routes/auth.ts`)
- **Validation**: Joi schemas validate request body/params before controller logic
- **Auth middleware**: `verifyToken` middleware on all protected routes
- **Admin middleware**: `requireAdmin` checks `role === 'admin'`
- **File uploads**: Multer with disk storage, MIME type validation, 100MB limit
- **API responses**: `{ success: true, data: {...} }` or `{ error: "message" }`

### Frontend Patterns

- **Expo Router**: File-based routing — `(auth)` group for unauthenticated, `(tabs)` for main app
- **Zustand stores**: One store per domain (`authStore`, `feedStore`). Access via `useAuthStore()`
- **Components**: Functional components with typed props interfaces
- **Lists**: Use `FlatList` with pagination, not `ScrollView` with `.map()`
- **Navigation**: Never use imperative `router.push` from stores — dispatch from components

---

## Environment & Config

### Required env vars (backend `.env`)

```
NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET,
JWT_EXPIRATION, UPLOAD_DIR, MAX_FILE_SIZE, EXPO_ACCESS_TOKEN
```

### Required env vars (frontend `.env`)

```
EXPO_PUBLIC_API_URL
```

---

## Commit & Logging Rules
- 모든 질문에 대한 답변은 하나의 커밋으로 저장한다.
- `/log` 폴더를 만들어서 한 번의 답변에 대한 수정사항들을 전부 하나의 md 파일을 생성해서 기록한다.

## Do's and Don'ts

### Do

- Run `npx tsc --noEmit` before considering any task complete
- Write tests for new services and API endpoints
- Follow the Controller → Service → Prisma pattern (backend)
- Use Zustand stores for all shared state (frontend)
- Use Joi for request validation (backend)
- Use `interface` for props and API response shapes
- Keep controllers thin — move logic to services
- Handle all Axios errors in interceptors or per-call `.catch()`

### Don't

- Suppress type errors with `as any`, `@ts-ignore`, `@ts-expect-error`
- Add dependencies without justification — check existing utils first
- Put business logic in controllers or route files
- Use `ScrollView` + `.map()` for lists — use `FlatList`
- Store sensitive values (tokens, passwords) in plain state — use SecureStore
- Leave `console.log` in committed code — use Winston (backend) or remove
- Write empty `catch(e) {}` blocks
- Skip running tests after changes
