# Webhook Server and Comment Reply Handler Implementation

**Date**: 2026-02-13  
**Session**: Webhook Server Implementation

---

## Summary

Implemented webhook server and comment reply handler for bot service with comprehensive test coverage.

---

## Files Created

### 1. `bot/src/webhook/webhookServer.ts`
**Purpose**: Express webhook server for receiving comment notifications from backend

**Key Features**:
- `POST /webhook` endpoint for comment webhook payload
- `GET /health` endpoint for health checks
- Validates required fields in webhook payload
- Optional webhook secret validation via `BOT_WEBHOOK_SECRET` header
- Fire-and-forget async processing (responds 200 immediately, processes in background)
- Error handling with logging

**Implementation Details**:
- Express middleware setup with `express.json()`
- Webhook payload validation:
  - Required: `postId`, `commentId`, `commentContent`, `commentAuthor`
  - Required author fields: `id`, `username`, `role`
  - Optional: `parentCommentId`
- Secret validation checks `x-webhook-secret` or `bot_webhook_secret` headers
- Calls `handleCommentWebhook()` without awaiting to respond immediately

### 2. `bot/src/webhook/commentReplyHandler.ts`
**Purpose**: Business logic for processing comment webhooks and generating bot replies

**Key Features**:
- BOT→BOT interaction prevention (ignores comments from bots)
- Identifies which bot owns the post
- Fetches comment thread for context
- Generates AI reply using OpenAI service
- Creates comment or reply depending on `parentCommentId`
- Complete error handling with logging (never throws)

**Implementation Details**:
- **Module-level state**: `botClients` Map storing authenticated KimitterClient instances for each bot type
- **`initializeBotClients()`**: Authenticates and stores clients for stock, politics, news bots
- **`getBotTypeByPostId()`**: Finds which bot owns a post by checking each bot's posts
- **`handleCommentWebhook()`**: Main handler with dependency injection for testability
  - Early return if comment author role is 'BOT'
  - Looks up bot ownership via `getBotTypeByPostId`
  - Fetches comment thread via `client.getComments()`
  - Generates reply via `generateCommentReply()`
  - Creates reply (`client.createReply()`) if parentCommentId exists, else creates comment (`client.createComment()`)

**Testability Pattern**:
- Exported `botClients` map for test manipulation
- Default parameter pattern for `getBotTypeByPostId` clients argument
- Dependency injection parameter `getBotFn` in `handleCommentWebhook` for mocking

### 3. `bot/src/webhook/__tests__/webhookServer.test.ts`
**Purpose**: Test coverage for webhook server endpoints

**Test Cases** (5 tests, all passing):
1. POST /webhook with valid payload → 200 response
2. POST /webhook missing required fields → 400 response
3. POST /webhook missing commentAuthor fields → 400 response
4. POST /webhook with parentCommentId → handles correctly
5. GET /health → 200 with status "ok" and timestamp

**Testing Approach**:
- Uses `supertest` to test Express app without starting server
- Mocks `handleCommentWebhook` to verify it's called with correct payload
- Validates response status codes and body structure

### 4. `bot/src/webhook/__tests__/commentReplyHandler.test.ts`
**Purpose**: Test coverage for comment reply logic

**Test Cases** (9 tests, all passing):

**getBotTypeByPostId tests**:
1. Returns botType and client when post is found
2. Returns null when post is not found
3. Handles errors gracefully (logs and returns null)

**handleCommentWebhook tests**:
1. Ignores bot comments to prevent BOT→BOT interaction
2. Logs warning when post is not owned by any bot
3. Generates reply and creates comment when AI succeeds
4. Creates reply instead of comment when parentCommentId exists
5. Logs warning when AI generation fails
6. Does not throw errors when webhook processing fails

**Testing Approach**:
- Mocks `openaiService.generateCommentReply`
- Mocks `KimitterClient` methods (getMyPosts, getComments, createComment, createReply)
- Uses dependency injection to pass mock `getBotFn` for testability
- Verifies correct AI prompts with post content and comment thread context
- Validates bot role check logic
- Ensures error handling never throws

---

## Dependencies Added

```bash
npm install --save-dev supertest @types/supertest
```

---

## Type Safety

- All functions and interfaces strictly typed
- No use of `any`, `@ts-ignore`, or `@ts-expect-error`
- Interfaces:
  - `WebhookPayload`: Webhook request body structure
  - `BotPostsResponse`: Response from `getMyPosts()`
  - `CommentResponse`: Individual comment structure

---

## Code Quality Checks

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Result**: ✅ No errors

### Test Suite
```bash
npm test
```
**Result**: ✅ 85 tests passed, 10 test suites passed

### Webhook-specific Tests
```bash
npm test -- src/webhook
```
**Result**: ✅ 14 tests passed, 2 test suites passed

---

## Integration Points

### With Backend
- Expects webhook POST requests to `/webhook` endpoint
- Payload format:
  ```typescript
  {
    postId: number;
    commentId: number;
    commentContent: string;
    commentAuthor: {
      id: number;
      username: string;
      role: 'USER' | 'BOT' | 'ADMIN';
    };
    parentCommentId: number | null;
  }
  ```

### With OpenAI Service
- Calls `generateCommentReply(botType, postContent, commentThread, userComment)`
- Receives generated reply text or null

### With Kimitter API
- `client.getMyPosts()`: Lists bot's posts to identify ownership
- `client.getComments(postId)`: Fetches comment thread for context
- `client.createComment(postId, content)`: Posts top-level comment
- `client.createReply(commentId, content)`: Posts reply to comment

---

## Security Considerations

1. **BOT→BOT Prevention**: Checks `commentAuthor.role === 'BOT'` before processing
2. **Optional Webhook Secret**: Validates `BOT_WEBHOOK_SECRET` header if configured
3. **Error Isolation**: Webhook handler catches all errors to prevent crashes
4. **Fire-and-forget**: Responds 200 immediately to prevent timeout issues

---

## Architecture Patterns

### Dependency Injection
- `handleCommentWebhook` accepts optional `getBotFn` parameter for testing
- Allows mocking internal dependencies without module-level mocks

### Module-level State
- `botClients` Map persists authenticated clients
- Initialized once via `initializeBotClients()`
- Reduces authentication overhead per request

### Error Handling
- Top-level try/catch in `handleCommentWebhook`
- Logs errors but never throws
- Individual operations (getComments, AI call) fail gracefully

---

## Future Considerations

- Add webhook signature verification for enhanced security
- Implement retry queue for failed AI generations
- Add rate limiting to prevent spam
- Consider caching comment threads to reduce API calls
- Add metrics/observability for webhook processing

---

## Files Modified

None - only new files created.

---

## Related Work

- Depends on existing `KimitterClient` (bot/src/api/kimitterClient.ts)
- Depends on existing `openaiService` (bot/src/services/openaiService.ts)
- Depends on existing `config` (bot/src/config/environment.ts)
- Depends on existing `logger` (bot/src/utils/logger.ts)

---

## Test Coverage Summary

| Module | Tests | Status |
|--------|-------|--------|
| webhookServer.ts | 5 | ✅ All passing |
| commentReplyHandler.ts | 9 | ✅ All passing |
| **Total** | **14** | **✅ 100%** |

---

## Configuration Required

Add to `bot/.env`:
```env
BOT_WEBHOOK_PORT=4000
BOT_WEBHOOK_SECRET=your-secret-here  # Optional
```

Add bot credentials to backend to trigger webhooks on new comments.

---

## Next Steps

1. Update `bot/src/index.ts` to start webhook server
2. Configure backend to send webhook requests on comment creation
3. Deploy and test end-to-end comment reply flow
4. Monitor logs for errors and performance
