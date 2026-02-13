import { prisma } from '../config/database';
import * as commentService from './commentService';

jest.mock('../config/database', () => ({ prisma: require('../test/helpers').makePrismaMock() }));
jest.mock('../config/environment', () => ({ config: { nodeEnv: 'test' } }));
jest.mock('./webhookService', () => ({ sendBotWebhook: jest.fn().mockResolvedValue(undefined) }));

const db = prisma as unknown as ReturnType<typeof import('../test/helpers').makePrismaMock>;

const basePost = { id: 1, userId: 10, content: 'post', deletedAt: null };
const baseComment = {
  id: 5,
  postId: 1,
  userId: 10,
  content: 'nice post',
  parentCommentId: null,
  deletedAt: null,
};

describe('createComment', () => {
  it('throws NotFoundError when post does not exist', async () => {
    db.post.findFirst.mockResolvedValue(null);
    await expect(commentService.createComment(1, 10, 'hi')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Post not found',
    });
  });

  it('creates comment when post exists', async () => {
    db.post.findFirst.mockResolvedValue(basePost);
    db.comment.create.mockResolvedValue(baseComment);
    db.user.findUnique.mockResolvedValue({ id: 10, role: 'USER', username: 'testuser' });
    const result = await commentService.createComment(1, 10, 'nice post');
    expect(result).toEqual(baseComment);
    expect(db.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ postId: 1, userId: 10, content: 'nice post' }) }),
    );
  });
});

describe('updateComment', () => {
  it('throws NotFoundError when comment does not exist', async () => {
    db.comment.findFirst.mockResolvedValue(null);
    await expect(commentService.updateComment(5, 10, 'edit')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws ForbiddenError when user is not owner', async () => {
    db.comment.findFirst.mockResolvedValue({ ...baseComment, userId: 99 });
    await expect(commentService.updateComment(5, 10, 'edit')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('updates comment when owner calls', async () => {
    db.comment.findFirst.mockResolvedValue(baseComment);
    db.comment.update.mockResolvedValue({ ...baseComment, content: 'edited' });
    const result = await commentService.updateComment(5, 10, 'edited');
    expect(result.content).toBe('edited');
  });
});

describe('deleteComment', () => {
  it('throws ForbiddenError for non-owner non-admin', async () => {
    db.comment.findFirst.mockResolvedValue({ ...baseComment, userId: 99 });
    await expect(commentService.deleteComment(5, 10, 'USER')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('allows admin to delete any comment', async () => {
    db.comment.findFirst.mockResolvedValue({ ...baseComment, userId: 99 });
    db.comment.update.mockResolvedValue({});
    await expect(commentService.deleteComment(5, 10, 'ADMIN')).resolves.toBeUndefined();
  });
});

describe('createReply', () => {
  it('throws NotFoundError when parent comment does not exist', async () => {
    db.comment.findFirst.mockResolvedValue(null);
    await expect(commentService.createReply(5, 10, 'reply')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('creates reply with correct parentCommentId', async () => {
    db.comment.findFirst.mockResolvedValue(baseComment);
    db.comment.create.mockResolvedValue({ ...baseComment, parentCommentId: 5, content: 'reply' });
    db.post.findUnique.mockResolvedValue({ id: 1, userId: 10 });
    db.user.findUnique.mockResolvedValue({ id: 10, role: 'USER', username: 'testuser' });
    const result = await commentService.createReply(5, 10, 'reply');
    expect(result.parentCommentId).toBe(5);
  });
});
