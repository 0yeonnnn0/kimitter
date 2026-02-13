import axios from 'axios';
import { KimitterClient } from './kimitterClient';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KimitterClient', () => {
  let client: KimitterClient;
  const apiUrl = 'http://localhost:3000/api';
  const username = 'test-bot';
  const password = 'test-password';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new KimitterClient({ apiUrl, username, password });
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await client.login();

      expect(mockedAxios.post).toHaveBeenCalledWith(`${apiUrl}/auth/login`, {
        username,
        password,
      });
    });

    it('should throw error on login failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(client.login()).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const loginResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
          },
        },
      };
      const refreshResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'new-access-token-789',
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(loginResponse);
      await client.login();

      mockedAxios.post.mockResolvedValueOnce(refreshResponse);
      await client.refreshAccessToken();

      expect(mockedAxios.post).toHaveBeenLastCalledWith(`${apiUrl}/auth/refresh`, {
        refreshToken: 'refresh-token-456',
      });
    });

    it('should throw error if not logged in', async () => {
      await expect(client.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('createPost', () => {
    beforeEach(async () => {
      const loginResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(loginResponse);
      await client.login();
    });

    it('should create post with content and tags', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            content: 'Test post',
            tags: ['tag1', 'tag2'],
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.createPost('Test post', ['tag1', 'tag2']);

      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        `${apiUrl}/posts`,
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-123',
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should auto-refresh token on 401 and retry', async () => {
      const error401 = {
        response: { status: 401 },
        isAxiosError: true,
      };
      const refreshResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'new-access-token-789',
          },
        },
      };
      const retryResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            content: 'Test post',
          },
        },
      };

      mockedAxios.post
        .mockRejectedValueOnce(error401)
        .mockResolvedValueOnce(refreshResponse)
        .mockResolvedValueOnce(retryResponse);

      const result = await client.createPost('Test post', []);

      expect(mockedAxios.post).toHaveBeenCalledTimes(4);
      expect(result).toEqual(retryResponse.data.data);
    });
  });

  describe('createComment', () => {
    beforeEach(async () => {
      const loginResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(loginResponse);
      await client.login();
    });

    it('should create comment on post', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            content: 'Test comment',
            postId: 5,
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.createComment(5, 'Test comment');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${apiUrl}/comments/post/5`,
        { content: 'Test comment' },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-123',
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('createReply', () => {
    beforeEach(async () => {
      const loginResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(loginResponse);
      await client.login();
    });

    it('should create reply to comment', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 2,
            content: 'Test reply',
            parentCommentId: 10,
          },
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.createReply(10, 'Test reply');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${apiUrl}/comments/10/replies`,
        { content: 'Test reply' },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-123',
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getComments', () => {
    beforeEach(async () => {
      const loginResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
          },
        },
      };
      mockedAxios.get = jest.fn();
      mockedAxios.post.mockResolvedValueOnce(loginResponse);
      await client.login();
    });

    it('should fetch comments for a post', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { id: 1, content: 'Comment 1' },
            { id: 2, content: 'Comment 2' },
          ],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getComments(5);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${apiUrl}/comments/post/5`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-123',
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getMyPosts', () => {
    beforeEach(async () => {
      const loginResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-456',
          },
        },
      };
      mockedAxios.get = jest.fn();
      mockedAxios.post.mockResolvedValueOnce(loginResponse);
      await client.login();
    });

    it('should fetch user posts with default pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { id: 1, content: 'Post 1' },
            { id: 2, content: 'Post 2' },
          ],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getMyPosts();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${apiUrl}/posts`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-123',
          }),
          params: { page: 1, limit: 20 },
        }),
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should fetch user posts with custom pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await client.getMyPosts(2, 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${apiUrl}/posts`,
        expect.objectContaining({
          params: { page: 2, limit: 10 },
        }),
      );
    });
  });
});
