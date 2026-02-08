import { prisma } from '../config/database';
import * as userService from './userService';

jest.mock('../config/database', () => ({ prisma: require('../test/helpers').makePrismaMock() }));
jest.mock('../config/environment', () => ({ config: { nodeEnv: 'test' } }));

const db = prisma as unknown as ReturnType<typeof import('../test/helpers').makePrismaMock>;

const baseUser = {
  id: 1,
  username: 'alice',
  nickname: '앨리스',
  profileImageUrl: null,
  role: 'USER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('getUserById', () => {
  it('throws NotFoundError when user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(userService.getUserById(999)).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    });
  });

  it('returns user when found', async () => {
    db.user.findUnique.mockResolvedValue(baseUser);
    const result = await userService.getUserById(1);
    expect(result.username).toBe('alice');
  });
});

describe('updateUser', () => {
  it('updates nickname', async () => {
    db.user.update.mockResolvedValue({ ...baseUser, nickname: '새닉네임' });
    const result = await userService.updateUser(1, { nickname: '새닉네임' });
    expect(result.nickname).toBe('새닉네임');
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { nickname: '새닉네임' } }),
    );
  });
});

describe('getUserPosts', () => {
  it('returns paginated posts', async () => {
    db.post.findMany.mockResolvedValue([{ id: 1, content: 'hi' }]);
    db.post.count.mockResolvedValue(1);
    const result = await userService.getUserPosts(1, 1, 10);
    expect(result.posts).toHaveLength(1);
    expect(result.totalPages).toBe(1);
  });
});
