import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';

interface KimitterClientConfig {
  apiUrl: string;
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class KimitterClient {
  private apiUrl: string;
  private username: string;
  private password: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: KimitterClientConfig) {
    this.apiUrl = config.apiUrl;
    this.username = config.username;
    this.password = config.password;
  }

  async login(): Promise<void> {
    try {
      const response = await axios.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
        username: this.username,
        password: this.password,
      });

      this.accessToken = response.data.data.accessToken;
      this.refreshToken = response.data.data.refreshToken;

      logger.info(`Logged in as ${this.username}`);
    } catch (error) {
      logger.error(`Login failed for ${this.username}: ${error}`);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      this.accessToken = response.data.data.accessToken;
      logger.info('Access token refreshed');
    } catch (error) {
      logger.error(`Token refresh failed: ${error}`);
      throw error;
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call login() first.');
    }

    const requestConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    };

    try {
      let response;
      const url = `${this.apiUrl}${endpoint}`;

      if (method === 'GET') {
        response = await axios.get<ApiResponse<T>>(url, requestConfig);
      } else if (method === 'POST') {
        response = await axios.post<ApiResponse<T>>(url, data, requestConfig);
      } else if (method === 'PUT') {
        response = await axios.put<ApiResponse<T>>(url, data, requestConfig);
      } else {
        response = await axios.delete<ApiResponse<T>>(url, requestConfig);
      }

      return response.data.data;
    } catch (error) {
      if (this.isAxiosError(error) && error.response?.status === 401) {
        logger.warn('Access token expired, refreshing...');
        await this.refreshAccessToken();

        requestConfig.headers = {
          ...requestConfig.headers,
          Authorization: `Bearer ${this.accessToken}`,
        };

        let response;
        const url = `${this.apiUrl}${endpoint}`;

        if (method === 'GET') {
          response = await axios.get<ApiResponse<T>>(url, requestConfig);
        } else if (method === 'POST') {
          response = await axios.post<ApiResponse<T>>(url, data, requestConfig);
        } else if (method === 'PUT') {
          response = await axios.put<ApiResponse<T>>(url, data, requestConfig);
        } else {
          response = await axios.delete<ApiResponse<T>>(url, requestConfig);
        }

        return response.data.data;
      }

      throw error;
    }
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true;
  }

  async createPost(content: string, tags: string[]): Promise<unknown> {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('tags', JSON.stringify(tags));

    return this.request('POST', '/posts', formData, {
      headers: formData.getHeaders(),
    });
  }

  async createComment(postId: number, content: string): Promise<unknown> {
    return this.request('POST', `/comments/post/${postId}`, { content });
  }

  async createReply(commentId: number, content: string): Promise<unknown> {
    return this.request('POST', `/comments/${commentId}/replies`, { content });
  }

  async getComments(postId: number): Promise<unknown> {
    return this.request('GET', `/comments/post/${postId}`);
  }

  async getMyPosts(page: number = 1, limit: number = 20): Promise<unknown> {
    return this.request('GET', '/posts', undefined, {
      params: { page, limit },
    });
  }
}
