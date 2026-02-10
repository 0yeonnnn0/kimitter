import api from './api';

export const getUser = (userId: number) => {
  return api.get(`/users/${userId}`);
};

export const getUserPosts = (userId: number, page = 1, limit = 20) => {
  return api.get(`/users/${userId}/posts`, { params: { page, limit } });
};
