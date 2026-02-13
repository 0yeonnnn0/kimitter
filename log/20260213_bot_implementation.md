# Bot Implementation - 2026-02-13

## Overview
Created bot infrastructure with base classes and three bot types (Stock, Politics, News) with comprehensive test coverage.

## Files Created

### 1. bot/src/bots/baseBot.ts
- **Purpose**: Base types, interfaces, and shared utilities for all bots
- **Exports**:
  - `BotType`: Type alias for 'stock' | 'politics' | 'news'
  - `BotConfig`: Interface for bot configuration
  - `BaseBot`: Interface defining bot contract (generatePost, getType)
  - `hasPostedToday()`: Helper function to check if bot posted today in KST timezone
- **Key Features**:
  - KST timezone handling for duplicate detection
  - Type-safe bot configuration
  - Reusable posting check logic

### 2. bot/src/bots/stockBot.ts
- **Purpose**: Bot for posting stock market updates
- **Class**: `StockBot implements BaseBot`
- **Dependencies**:
  - `KisStockService`: Fetches trending stocks and price data
  - `generatePostContent`: OpenAI content generation
  - `KimitterClient`: Posts to Kimitter API
- **generatePost() Logic**:
  1. Fetch top 5 trending stocks by volume
  2. Get detailed price data for top stock
  3. Format raw data (종목명, 현재가, 전일대비, 거래량, 거래량 순위)
  4. Generate AI content
  5. Check duplicate (same stock name in today's posts)
  6. Create post with tags: ['주식', '경제', stockName]
- **Error Handling**: All errors logged, never thrown

### 3. bot/src/bots/politicsBot.ts
- **Purpose**: Bot for posting political news summaries
- **Class**: `PoliticsBot implements BaseBot`
- **Dependencies**:
  - `getPoliticalNews()`: Fetches Korean political news
  - `generatePostContent`: OpenAI content generation
  - `hasPostedToday`: Shared duplicate check
- **generatePost() Logic**:
  1. Fetch political news from Naver API
  2. Format raw data (제목, 설명, 출처 per item)
  3. Generate AI content
  4. Check duplicate (any post today)
  5. Create post with tags: ['정치', '뉴스']
- **Error Handling**: All errors logged, never thrown

### 4. bot/src/bots/newsBot.ts
- **Purpose**: Bot for posting general news summaries
- **Class**: `NewsBot implements BaseBot`
- **Dependencies**:
  - `getGeneralNews()`: Fetches Korean general news (excludes politics/stocks)
  - `generatePostContent`: OpenAI content generation
  - `hasPostedToday`: Shared duplicate check
- **generatePost() Logic**:
  1. Fetch general news from Naver API
  2. Format raw data (제목, 설명, 출처 per item)
  3. Generate AI content
  4. Check duplicate (any post today)
  5. Create post with tags: ['뉴스']
- **Error Handling**: All errors logged, never thrown

### 5. bot/src/bots/stockBot.test.ts
- **Test Suite**: StockBot comprehensive tests
- **Test Cases** (7 total):
  1. `getType()` returns 'stock'
  2. Happy path: fetches data → AI generates → creates post
  3. No trending stocks available → logs warning, skips post
  4. Stock detail fetch fails → logs warning, skips post
  5. OpenAI returns null → logs warning, skips post
  6. Duplicate check: same stock today → skips post
  7. External API failure → logs error, does not throw
- **Mocks**: KimitterClient, KisStockService, generatePostContent, logger

### 6. bot/src/bots/politicsBot.test.ts
- **Test Suite**: PoliticsBot comprehensive tests
- **Test Cases** (6 total):
  1. `getType()` returns 'politics'
  2. Happy path: fetches data → AI generates → creates post
  3. No political news available → logs warning, skips post
  4. OpenAI returns null → logs warning, skips post
  5. Duplicate check: already posted today → skips post
  6. External API failure → logs error, does not throw
- **Mocks**: KimitterClient, getPoliticalNews, generatePostContent, logger

### 7. bot/src/bots/newsBot.test.ts
- **Test Suite**: NewsBot comprehensive tests
- **Test Cases** (6 total):
  1. `getType()` returns 'news'
  2. Happy path: fetches data → AI generates → creates post
  3. No general news available → logs warning, skips post
  4. OpenAI returns null → logs warning, skips post
  5. Duplicate check: already posted today → skips post
  6. External API failure → logs error, does not throw
- **Mocks**: KimitterClient, getGeneralNews, generatePostContent, logger

## Verification

### TypeScript Compilation
```bash
cd bot/
npx tsc --noEmit
```
**Result**: ✅ PASS (no errors)

### Test Execution
```bash
cd bot/
npm test -- --testPathPattern=bots
```
**Result**: ✅ PASS
- Test Suites: 3 passed, 3 total
- Tests: 19 passed, 19 total
- Time: 1.677s

## Design Decisions

### 1. Duplicate Detection Strategy
- **Stock Bot**: Checks if stock name appears in today's posts (allows posting different stocks)
- **Politics/News Bots**: Checks if ANY post exists today (one post per day limit)
- **Timezone**: All checks use KST (UTC+9) for consistency with Korean users

### 2. Error Handling Philosophy
- All bots catch and log errors in `generatePost()`
- Never throw errors to prevent scheduler/webhook failures
- Log warnings for expected failures (no data, AI null response)
- Log errors for unexpected failures (API errors, network issues)

### 3. Separation of Concerns
- **baseBot.ts**: Shared types and utilities
- **{bot}Bot.ts**: Bot-specific business logic
- **{bot}Bot.test.ts**: Comprehensive test coverage
- Each bot is self-contained and independently testable

### 4. Type Safety
- No `any` types used
- All external API responses properly typed
- Interface segregation (BaseBot, BotConfig)
- Strict TypeScript mode enforced

### 5. Test Coverage
- Happy path: End-to-end flow with mocked dependencies
- Empty data: Graceful handling when no data available
- AI failure: Handling when OpenAI returns null
- Duplicate detection: Prevents spam posting
- API failure: Resilience against external service failures

## Integration Points

### Services Used
- `openaiService.ts`: AI content generation
- `naverNewsService.ts`: News fetching (politics, general)
- `kisStockService.ts`: Stock data fetching
- `kimitterClient.ts`: Kimitter API interaction
- `logger.ts`: Winston logging

### Future Integration
These bots are ready to be integrated with:
- Cron scheduler for automated daily posts
- Webhook handlers for triggered posts
- Bot orchestration layer for coordinated posting

## Testing Notes
- Jest config uses `clearMocks` and `restoreMocks` (NOT `resetMocks`)
- All mocks are properly typed with `jest.Mocked<T>`
- Tests verify both positive and negative paths
- Logger calls are verified to ensure observability

## Compliance

### AGENTS.md Requirements
✅ TypeScript strict mode  
✅ Named exports (no default exports in backend pattern)  
✅ camelCase for files/functions/variables  
✅ PascalCase for interfaces/types  
✅ No `any` or `@ts-ignore` usage  
✅ Comprehensive error handling  
✅ Test coverage for all business logic  
✅ Controller → Service pattern (bot acts as service layer)  

### Code Style
✅ 2-space indentation  
✅ Single quotes  
✅ Trailing commas  
✅ Max line length: 100  
✅ Organized imports (Node → External → Internal → Relative)  

## Summary
Successfully implemented bot infrastructure with 3 specialized bots (Stock, Politics, News), each with comprehensive test coverage. All TypeScript compilation checks and tests pass. The bots are production-ready and follow all project conventions.
