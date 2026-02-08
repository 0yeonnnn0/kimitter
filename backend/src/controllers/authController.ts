import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export const validateCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.validateInvitationCode(req.body.code);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, username, password, nickname } = req.body;
    const result = await authService.register(code, username, password, nickname);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.changePassword(req.userId!, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, data: { message: 'Password changed' } });
  } catch (err) {
    next(err);
  }
};
