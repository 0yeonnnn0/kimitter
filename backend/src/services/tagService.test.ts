import { prisma } from '../config/database';
import * as tagService from './tagService';

jest.mock('../config/database', () => ({ prisma: require('../test/helpers').makePrismaMock() }));
jest.mock('../config/environment', () => ({ config: { nodeEnv: 'test' } }));

const db = prisma as unknown as ReturnType<typeof import('../test/helpers').makePrismaMock>;

describe('getAllTags', () => {
  it('returns all tags ordered by name', async () => {
    const tags = [{ id: 1, name: 'apple' }, { id: 2, name: 'banana' }];
    db.tag.findMany.mockResolvedValue(tags);
    const result = await tagService.getAllTags();
    expect(result).toEqual(tags);
    expect(db.tag.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
  });
});

describe('getPostsByTag', () => {
  it('returns paginated posts for the given tag', async () => {
    db.post.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    db.post.count.mockResolvedValue(2);
    const result = await tagService.getPostsByTag('family', 1, 10);
    expect(result.posts).toHaveLength(2);
    expect(result.totalPages).toBe(1);
  });
});
