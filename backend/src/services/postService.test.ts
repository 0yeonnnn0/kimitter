import { prisma } from '../config/database';
import * as postService from './postService';

jest.mock('../config/database', () => ({ prisma: require('../test/helpers').makePrismaMock() }));
jest.mock('../config/environment', () => ({
  config: { nodeEnv: 'test' },
}));

const db = prisma as unknown as ReturnType<typeof import('../test/helpers').makePrismaMock>;

const basePost = {
  id: 1,
  userId: 10,
  content: 'Hello world',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('getPostById', () => {
  it('throws NotFoundError when post does not exist', async () => {
    db.post.findFirst.mockResolvedValue(null);
    await expect(postService.getPostById(999, 1)).rejects.toMatchObject({
      message: 'Post not found',
      statusCode: 404,
    });
  });

  it('returns post when found', async () => {
    db.post.findFirst.mockResolvedValue(basePost);
    db.like.findMany.mockResolvedValue([]);
    const result = await postService.getPostById(1, 1);
    expect(result).toEqual({ ...basePost, isLiked: false });
    expect(db.post.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, deletedAt: null } }),
    );
  });
});

describe('getPosts', () => {
  it('returns paginated posts with totalPages', async () => {
    db.post.findMany.mockResolvedValue([basePost]);
    db.post.count.mockResolvedValue(25);
    db.like.findMany.mockResolvedValue([]);

    const result = await postService.getPosts(1, 10, 1);
    expect(result.posts).toHaveLength(1);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });
});

describe('deletePost', () => {
  it('throws NotFoundError when post does not exist', async () => {
    db.post.findFirst.mockResolvedValue(null);
    await expect(postService.deletePost(1, 10, 'USER')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws ForbiddenError when non-owner non-admin tries to delete', async () => {
    db.post.findFirst.mockResolvedValue({ ...basePost, userId: 99 });
    await expect(postService.deletePost(1, 10, 'USER')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('allows admin to delete any post', async () => {
    db.post.findFirst.mockResolvedValue({ ...basePost, userId: 99 });
    db.post.update.mockResolvedValue({});
    await expect(postService.deletePost(1, 10, 'ADMIN')).resolves.toBeUndefined();
    expect(db.post.update).toHaveBeenCalled();
  });

  it('allows owner to delete own post', async () => {
    db.post.findFirst.mockResolvedValue({ ...basePost, userId: 10 });
    db.post.update.mockResolvedValue({});
    await expect(postService.deletePost(1, 10, 'USER')).resolves.toBeUndefined();
  });
});

describe('updatePost', () => {
  it('throws ForbiddenError when user is not owner', async () => {
    db.post.findFirst.mockResolvedValue({ ...basePost, userId: 99 });
    await expect(postService.updatePost(1, 10, 'new content')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('updates post when owner calls', async () => {
    db.post.findFirst.mockResolvedValue(basePost);
    db.post.update.mockResolvedValue({ ...basePost, content: 'updated' });
    const result = await postService.updatePost(1, 10, 'updated');
    expect(result.content).toBe('updated');
  });
});
