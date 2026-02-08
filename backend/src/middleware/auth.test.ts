import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import * as jwtUtils from '../utils/jwt';

jest.mock('../utils/jwt');
const mockVerifyAccessToken = jwtUtils.verifyAccessToken as jest.Mock;

const mockReq = (authHeader?: string) =>
  ({ headers: { authorization: authHeader } } as unknown as Request);

const mockRes = () => ({} as Response);

const mockNext = () => jest.fn() as unknown as NextFunction;

describe('verifyToken middleware', () => {
  it('calls next with UnauthorizedError when no Authorization header', () => {
    const next = mockNext();
    verifyToken(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No token provided', statusCode: 401 }),
    );
  });

  it('calls next with UnauthorizedError when header does not start with Bearer', () => {
    const next = mockNext();
    verifyToken(mockReq('Basic abc123'), mockRes(), next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('sets userId and userRole on req when token is valid', () => {
    mockVerifyAccessToken.mockReturnValue({ userId: 7, role: 'ADMIN' });
    const next = mockNext();
    const req = mockReq('Bearer valid.token');
    verifyToken(req, mockRes(), next);
    expect(req.userId).toBe(7);
    expect(req.userRole).toBe('ADMIN');
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with UnauthorizedError when token verification throws', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const next = mockNext();
    verifyToken(mockReq('Bearer expired.token'), mockRes(), next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired token', statusCode: 401 }),
    );
  });
});
