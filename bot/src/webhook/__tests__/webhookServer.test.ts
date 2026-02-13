import request from 'supertest';
import express from 'express';
import { createWebhookServer } from '../webhookServer';
import * as commentReplyHandler from '../commentReplyHandler';

jest.mock('../commentReplyHandler');

describe('webhookServer', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createWebhookServer();
    jest.clearAllMocks();
  });

  describe('POST /webhook', () => {
    it('should return 200 with valid payload', async () => {
      const mockHandleWebhook = jest
        .spyOn(commentReplyHandler, 'handleCommentWebhook')
        .mockResolvedValue();

      const payload = {
        postId: 1,
        commentId: 10,
        commentContent: 'This is a test comment',
        commentAuthor: {
          id: 5,
          username: 'testuser',
          role: 'USER',
        },
        parentCommentId: null,
      };

      const response = await request(app).post('/webhook').send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(mockHandleWebhook).toHaveBeenCalledWith({
        postId: 1,
        commentId: 10,
        commentContent: 'This is a test comment',
        commentAuthor: {
          id: 5,
          username: 'testuser',
          role: 'USER',
        },
        parentCommentId: null,
      });
    });

    it('should return 400 when missing postId', async () => {
      const payload = {
        commentId: 10,
        commentContent: 'Test',
        commentAuthor: {
          id: 5,
          username: 'testuser',
          role: 'USER',
        },
      };

      const response = await request(app).post('/webhook').send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should return 400 when missing commentAuthor fields', async () => {
      const payload = {
        postId: 1,
        commentId: 10,
        commentContent: 'Test',
        commentAuthor: {
          id: 5,
        },
      };

      const response = await request(app).post('/webhook').send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle parentCommentId when provided', async () => {
      const mockHandleWebhook = jest
        .spyOn(commentReplyHandler, 'handleCommentWebhook')
        .mockResolvedValue();

      const payload = {
        postId: 1,
        commentId: 10,
        commentContent: 'This is a reply',
        commentAuthor: {
          id: 5,
          username: 'testuser',
          role: 'USER',
        },
        parentCommentId: 8,
      };

      const response = await request(app).post('/webhook').send(payload);

      expect(response.status).toBe(200);
      expect(mockHandleWebhook).toHaveBeenCalledWith({
        postId: 1,
        commentId: 10,
        commentContent: 'This is a reply',
        commentAuthor: {
          id: 5,
          username: 'testuser',
          role: 'USER',
        },
        parentCommentId: 8,
      });
    });
  });

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });
});
