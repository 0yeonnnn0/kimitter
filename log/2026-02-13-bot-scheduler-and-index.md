# Bot Scheduler, Index, and Seed Script Implementation

**Date**: 2026-02-13  
**Task**: Create scheduler, index entry point, seed script, and tests for Kimitter bot service

---

## Summary

Implemented the core scheduling system for the Kimitter bot service, including:
- `bot/src/scheduler.ts` — Cron-based scheduler for 3 bots (stock, politics, news)
- `bot/src/index.ts` — Application entry point with webhook server and scheduler
- `bot/scripts/seedBotUsers.ts` — Bot user creation seed script
- `bot/src/scheduler.test.ts` — Comprehensive scheduler tests
- `bot/src/bots/newsBot.ts` — News bot implementation (missing from previous tasks)

---

## Files Created

### 1. `bot/src/bots/newsBot.ts`
- Implements `NewsBot` class following the same pattern as `StockBot` and `PoliticsBot`
- Uses `getGeneralNews()` from `naverNewsService`
- Generates posts with OpenAI using 'news' bot type
- Checks for duplicate posts using `hasPostedToday()` helper
- Tags posts with `['뉴스']`

### 2. `bot/src/scheduler.ts`
- **Interface**: `ScheduledTask` — Tracks cron job name, expression, and task instance
- **Class**: `BotScheduler`
  - `initialize()`: Creates 3 `KimitterClient` instances and logs them in
  - `start()`: Registers 3 cron jobs with Asia/Seoul timezone:
    - Politics bot: `'0 8 * * *'` (daily 8:00 AM KST)
    - News bot: `'1 8 * * *'` (daily 8:01 AM KST)
    - Stock bot: `'2 8 * * 1'` (every Monday 8:02 AM KST)
  - `stop()`: Stops all scheduled tasks
  - `getTasks()`: Returns copy of tasks array
  - Respects `config.bot.enabled` flag — logs info and returns early if disabled

### 3. `bot/src/index.ts`
- **Function**: `main()` — Application entry point
  1. Creates `BotScheduler` instance
  2. Calls `scheduler.initialize()` to login bot accounts
  3. Creates webhook server via `createWebhookServer()`
  4. Starts server on `config.bot.webhookPort`
  5. Starts scheduler
  6. Sets up graceful shutdown handlers for SIGTERM and SIGINT
- Calls `main()` with error handling that logs fatal errors and exits

### 4. `bot/scripts/seedBotUsers.ts`
- Generates 3 bot users with random 64-char hex passwords:
  - `stock-bot` (📊 주식봇)
  - `politics-bot` (🏛️ 정치봇)
  - `news-bot` (📰 뉴스봇)
- Prints credentials in `.env` format for manual setup
- Provides `curl` examples for manual registration via `/auth/register`
- Includes instructions for updating user role to 'BOT' via database
- Optional: Attempts automatic registration if `ADMIN_TOKEN` env var is set
- Uses `crypto.randomBytes(32).toString('hex')` for secure password generation

### 5. `bot/src/scheduler.test.ts`
- **Test Coverage** (5 tests, all passing):
  1. `initialize()` creates and logs in 3 bot clients
  2. `start()` registers 3 cron jobs with correct expressions
  3. `start()` with `BOT_ENABLED=false` → no jobs registered
  4. `stop()` stops all scheduled tasks
  5. `getTasks()` returns a copy of tasks array
- Mocks: `node-cron`, `KimitterClient`, bot classes
- Verifies cron expressions, timezone, and task metadata

---

## Key Design Decisions

### Scheduler Architecture
- **Separate clients per bot**: Each bot gets its own `KimitterClient` instance to avoid token conflicts
- **Fixed cron schedules**: No dynamic schedule changes — keeps implementation simple
- **Timezone-aware**: All cron jobs use `'Asia/Seoul'` timezone for consistent KST scheduling
- **Graceful degradation**: If `BOT_ENABLED=false`, scheduler logs info and skips job registration

### Entry Point Design
- **Sequential initialization**: Scheduler must initialize (login) before starting
- **Graceful shutdown**: SIGTERM/SIGINT handlers stop scheduler and close server cleanly
- **Error handling**: Fatal errors logged and process exits with code 1

### Seed Script Design
- **Manual-first approach**: Prints credentials and instructions for manual setup
- **Optional automation**: If `ADMIN_TOKEN` provided, attempts automatic registration
- **Secure passwords**: 64-char hex strings (256 bits of entropy)
- **Idempotent**: Checks for existing users and skips if already created

---

## Testing Results

### Type Check
```bash
cd bot && npx tsc --noEmit
# ✓ No errors
```

### Scheduler Tests
```bash
cd bot && npm test -- scheduler.test.ts
# ✓ 5 passed
```

### All Tests
```bash
cd bot && npm test
# ✓ 82 passed, 3 failed (unrelated to scheduler)
# Failed tests are in commentReplyHandler (pre-existing)
```

---

## Cron Schedule Summary

| Bot | Cron Expression | Schedule | Timezone |
|-----|----------------|----------|----------|
| Politics | `0 8 * * *` | Daily 8:00 AM | Asia/Seoul |
| News | `1 8 * * *` | Daily 8:01 AM | Asia/Seoul |
| Stock | `2 8 * * 1` | Every Monday 8:02 AM | Asia/Seoul |

---

## Usage

### Running the Bot Service
```bash
cd bot
npm run dev  # Development mode with ts-node
npm start    # Production mode (requires npm run build first)
```

### Seeding Bot Users
```bash
cd bot
npx ts-node scripts/seedBotUsers.ts

# With admin token (optional)
ADMIN_TOKEN=your-admin-jwt npx ts-node scripts/seedBotUsers.ts
```

### Environment Variables Required
```env
# Bot service
BOT_ENABLED=true
BOT_WEBHOOK_PORT=4000

# Bot credentials (from seed script output)
BOT_STOCK_USERNAME=stock-bot
BOT_STOCK_PASSWORD=<generated-password>
BOT_POLITICS_USERNAME=politics-bot
BOT_POLITICS_PASSWORD=<generated-password>
BOT_NEWS_USERNAME=news-bot
BOT_NEWS_PASSWORD=<generated-password>

# Kimitter API
KIMITTER_API_URL=http://localhost:3000/api
```

---

## Integration Notes

- **Webhook server**: Runs on same port as scheduler (default 4000)
- **Health check**: `GET /health` endpoint available for monitoring
- **Graceful shutdown**: Both scheduler and webhook server stop cleanly on SIGTERM/SIGINT
- **Bot clients**: Automatically refresh access tokens on 401 responses
- **Duplicate prevention**: Each bot checks if it has already posted today before creating new posts

---

## Next Steps

1. Deploy bot service to production environment
2. Create bot users via seed script
3. Configure environment variables with bot credentials
4. Start bot service and verify cron jobs are registered
5. Monitor logs for scheduled post creation
6. Test webhook endpoint with comment notifications

---

## Files Modified

- None (all new files)

## Files Created

1. `bot/src/bots/newsBot.ts` (53 lines)
2. `bot/src/scheduler.ts` (122 lines)
3. `bot/src/index.ts` (32 lines)
4. `bot/scripts/seedBotUsers.ts` (95 lines)
5. `bot/src/scheduler.test.ts` (213 lines)

**Total**: 515 lines of new code + tests
