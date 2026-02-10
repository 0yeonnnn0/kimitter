import api from './api';

export const getUser = (userId: number) => {
  return api.get(`/users/${userId}`);
};

export const getUserPosts = (userId: number, page = 1, limit = 20) => {
  return api.get(`/users/${userId}/posts`, { params: { page, limit } });
};

export const getUserRepliedPosts = (userId: number, page = 1, limit = 20) => {
  return api.get(`/users/${userId}/replies`, { params: { page, limit } });
};

export const getUserMediaPosts = (userId: number, page = 1, limit = 20) => {
  return api.get(`/users/${userId}/media-posts`, { params: { page, limit } });
};

export const updateMe = (formData: FormData) => {
  return api.put('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
