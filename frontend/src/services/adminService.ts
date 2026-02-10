import api from './api';
import type { ApiResponse } from '../types/api';

interface InviteResult {
  invitation: {
    id: number;
    code: string;
    email: string | null;
    expiresAt: string | null;
    createdAt: string;
  };
  emailSent: boolean;
  reused: boolean;
}

export const inviteByEmail = (email: string) =>
  api.post<ApiResponse<InviteResult>>('/admin/invite', { email });
