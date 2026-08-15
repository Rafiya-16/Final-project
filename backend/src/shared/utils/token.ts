import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiry,
    } as SignOptions
  );
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      ...payload,
      jti: randomUUID(),
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry,
    } as SignOptions
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(
    token,
    config.jwt.accessSecret
  ) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(
    token,
    config.jwt.refreshSecret
  ) as TokenPayload;
};