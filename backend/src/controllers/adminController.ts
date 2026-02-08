import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import * as adminService from '../services/adminService';

export const createInvitationCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = await adminService.createInvitationCode(
      req.userId!,
      req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    );
    res.status(201).json({ success: true, data: code });
  } catch (err) {
    next(err);
  }
};

export const getInvitationCodes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const codes = await adminService.getInvitationCodes();
    res.json({ success: true, data: codes });
  } catch (err) {
    next(err);
  }
};

export const deleteInvitationCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteInvitationCode(req.params.code);
    res.json({ success: true, data: { message: 'Invitation code deleted' } });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.updateUserRole(Number(req.params.userId), req.body.role as Role);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteUser(Number(req.params.userId));
    res.json({ success: true, data: { message: 'User deactivated' } });
  } catch (err) {
    next(err);
  }
};

export const deletePostAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.deletePostAdmin(Number(req.params.postId));
    res.json({ success: true, data: { message: 'Post deleted' } });
  } catch (err) {
    next(err);
  }
};

export const getStatistics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
