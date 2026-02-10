import api from './api';
import type { Tag } from '../types/models';
import type { ApiResponse } from '../types/api';

export const searchTags = (q: string) =>
  api.get<ApiResponse<Tag[]>>('/tags/search', { params: { q } });

export const getPostsByTag = (tagName: string, page = 1, limit = 20) =>
  api.get(`/tags/${tagName}/posts`, { params: { page, limit } });
