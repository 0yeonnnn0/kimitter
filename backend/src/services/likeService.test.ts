import { prisma } from '../config/database';
import * as likeService from './likeService';

jest.mock('../config/database', () => ({ prisma: require('../test/helpers').makePrismaMock() }));
jest.mock('../config/environment', () => ({ config: { nodeEnv: 'test' } }));

const db = prisma as unknown as ReturnType<typeof import('../test/helpers').makePrismaMock>;

describe('togglePostLike', () => {
  it('removes like when already liked, returns { liked: false }', async () => {
    db.like.findFirst.mockResolvedValue({ id: 1, userId: 1, postId: 1 });
    db.like.delete.mockResolvedValue({});
    const result = await likeService.togglePostLike(1, 1);
    expect(result).toEqual({ liked: false });
    expect(db.like.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('creates like when not yet liked, returns { liked: true }', async () => {
    db.like.findFirst.mockResolvedValue(null);
    db.like.create.mockResolvedValue({});
    const result = await likeService.togglePostLike(1, 1);
    expect(result).toEqual({ liked: true });
    expect(db.like.create).toHaveBeenCalledWith({ data: { userId: 1, postId: 1 } });
  });
});

describe('toggleCommentLike', () => {
  it('removes like when already liked', async () => {
    db.like.findFirst.mockResolvedValue({ id: 2, userId: 1, commentId: 5 });
    db.like.delete.mockResolvedValue({});
    const result = await likeService.toggleCommentLike(1, 5);
    expect(result).toEqual({ liked: false });
  });

  it('creates like when not yet liked', async () => {
    db.like.findFirst.mockResolvedValue(null);
    db.like.create.mockResolvedValue({});
    const result = await likeService.toggleCommentLike(1, 5);
    expect(result).toEqual({ liked: true });
  });
});
