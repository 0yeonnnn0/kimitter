import api from './api';
import type { ApiResponse } from '../types/api';

interface InviteResult {
  invitation: {
    id: number;
    code: string;
    email: string;
    expiresAt: string;
    createdAt: string;
  };
  emailSent: boolean;
}

export const inviteByEmail = (email: string) =>
  api.post<ApiResponse<InviteResult>>('/admin/invite', { email });
