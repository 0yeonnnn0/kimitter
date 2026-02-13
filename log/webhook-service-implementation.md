# Webhook Service Implementation

**Date**: 2026-02-13  
**Task**: Create webhook service to dispatch webhooks when users comment on bot posts

---

## Summary

Implemented a webhook dispatch system that sends HTTP POST requests to a configured webhook URL whenever a non-bot user comments on a bot's post. The implementation follows a fire-and-forget pattern to ensure comment creation is not delayed or blocked by webhook failures.

---

## Files Created

### 1. `backend/src/services/webhookService.ts`
- **Purpose**: Webhook dispatch service
- **Key Features**:
  - `WebhookPayload` interface defining webhook payload structure
  - `sendBotWebhook()` function that:
    - Checks if webhook URL is configured (skips if empty)
    - POSTs payload to webhook URL with 5-second timeout
    - Logs success/failure
    - Never throws errors (fire-and-forget pattern)

### 2. `backend/src/services/webhookService.test.ts`
- **Purpose**: Unit tests for webhook service
- **Test Coverage**:
  - ✓ Sends correct payload via POST to webhook URL
  - ✓ Skips without error when BOT_WEBHOOK_URL is empty
  - ✓ Logs error but does not throw when HTTP request fails
- **Mocking**: axios, config, logger

---

## Files Modified

### 1. `backend/src/config/environment.ts`
- **Change**: Added `botWebhookUrl: process.env.BOT_WEBHOOK_URL || ''` to config object
- **Purpose**: Read webhook URL from environment variable

### 2. `backend/.env.example`
- **Change**: Added `BOT_WEBHOOK_URL=http://localhost:4000/webhook` example
- **Purpose**: Document the new environment variable

### 3. `backend/src/services/commentService.ts`
- **Changes**:
  - Imported `sendBotWebhook` from `./webhookService`
  - In `createComment()`:
    - Added post author role lookup
    - Added comment author role lookup
    - Added webhook dispatch when post author is BOT and comment author is not BOT
    - Fire-and-forget pattern with `.catch()` error handler
  - In `createReply()`:
    - Added post lookup via parent comment's postId
    - Added post author role lookup
    - Added reply author role lookup
    - Added webhook dispatch when post author is BOT and reply author is not BOT
    - Fire-and-forget pattern with `.catch()` error handler

### 4. `backend/src/test/helpers.ts`
- **Change**: Added `findUnique: jest.fn()` to `post` mock
- **Purpose**: Support new `prisma.post.findUnique()` call in `createReply()`

### 5. `backend/src/services/commentService.test.ts`
- **Changes**:
  - Added mock for `./webhookService`
  - Added `db.user.findUnique()` mock in "creates comment when post exists" test
  - Added `db.post.findUnique()` and `db.user.findUnique()` mocks in "creates reply with correct parentCommentId" test
- **Purpose**: Support new user/post lookups for webhook dispatch logic

---

## Test Results

### Webhook Service Tests
```
PASS src/services/webhookService.test.ts
  webhookService
    sendBotWebhook
      ✓ should send correct payload via POST to webhook URL
      ✓ should skip without error when BOT_WEBHOOK_URL is empty
      ✓ should log error but not throw when HTTP request fails

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Comment Service Tests
```
PASS src/services/commentService.test.ts
  createComment
    ✓ throws NotFoundError when post does not exist
    ✓ creates comment when post exists
  updateComment
    ✓ throws NotFoundError when comment does not exist
    ✓ throws ForbiddenError when user is not owner
    ✓ updates comment when owner calls
  deleteComment
    ✓ throws ForbiddenError for non-owner non-admin
    ✓ allows admin to delete any comment
  createReply
    ✓ throws NotFoundError when parent comment does not exist
    ✓ creates reply with correct parentCommentId

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

### Overall Test Results
```
Test Suites: 10 passed, 11 total (1 pre-existing failure in postService.test.ts)
Tests:       55 passed, 55 total
```

**Note**: The postService.test.ts failure is pre-existing and unrelated to webhook implementation.

### Type Check
```
npx tsc --noEmit
✓ No type errors
```

---

## Implementation Details

### Webhook Payload Structure
```typescript
interface WebhookPayload {
  postId: number;
  commentId: number;
  commentContent: string;
  commentAuthor: { id: number; username: string; role: string };
  parentCommentId: number | null;
}
```

### Fire-and-Forget Pattern
The webhook dispatch uses a fire-and-forget pattern to ensure comment creation is not delayed:
```typescript
sendBotWebhook(payload).catch((err) => 
  logger.error('Webhook dispatch failed', { error: err })
);
```

### Safety Guards
- Webhook URL check: Skips dispatch if `BOT_WEBHOOK_URL` is empty/undefined
- Role check: Only dispatches when post author is BOT and comment author is not BOT
- Error handling: Never throws errors, always logs failures
- Timeout: 5-second timeout on HTTP requests

---

## Usage

### Configuration
Add to `.env`:
```env
BOT_WEBHOOK_URL=http://localhost:4000/webhook
```

### Webhook Payload Example
When user "testuser" comments "Hello!" on bot post #123:
```json
{
  "postId": 123,
  "commentId": 456,
  "commentContent": "Hello!",
  "commentAuthor": {
    "id": 2,
    "username": "testuser",
    "role": "USER"
  },
  "parentCommentId": null
}
```

For replies, `parentCommentId` will contain the parent comment ID.

---

## Verification Checklist

- [x] `webhookService.ts` created with correct interface and function
- [x] `webhookService.test.ts` created with 3 passing tests
- [x] `environment.ts` modified to add `botWebhookUrl`
- [x] `.env.example` modified to add `BOT_WEBHOOK_URL`
- [x] `commentService.ts` modified to dispatch webhooks in `createComment()`
- [x] `commentService.ts` modified to dispatch webhooks in `createReply()`
- [x] `test/helpers.ts` updated to support new mocks
- [x] `commentService.test.ts` updated with necessary mocks
- [x] `npx tsc --noEmit` passes
- [x] All webhook and comment service tests pass
- [x] Fire-and-forget pattern implemented (no blocking)
- [x] Safety guards in place (URL check, role check, error handling)
