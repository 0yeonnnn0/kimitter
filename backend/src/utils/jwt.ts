import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/environment';

interface AccessTokenPayload {
  userId: number;
  role: string;
}

interface RefreshTokenPayload {
  userId: number;
}

export const generateAccessToken = (userId: number, role: string): string => {
  const options: SignOptions = { expiresIn: config.jwtExpiration as SignOptions['expiresIn'] };
  return jwt.sign({ userId, role }, config.jwtSecret, options);
};

export const generateRefreshToken = (userId: number): string => {
  const options: SignOptions = { expiresIn: config.jwtRefreshExpiration as SignOptions['expiresIn'] };
  return jwt.sign({ userId }, config.jwtRefreshSecret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
  return { userId: payload.userId, role: payload.role };
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = jwt.verify(token, config.jwtRefreshSecret) as RefreshTokenPayload;
  return { userId: payload.userId };
};
