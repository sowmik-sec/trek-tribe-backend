import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../config';

const createToken = (payload: Record<string, unknown>, secret: Secret, expiresIn: string) => {
  const token = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
  } as jwt.SignOptions);
  return token;
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};

const createPasswordResetToken = (payload: Record<string, unknown>) => {
  return jwt.sign(
    payload,
    config.jwt.reset_password_token as Secret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwt.reset_password_expires_in,
    } as jwt.SignOptions
  );
};

export const jwtHelpers = {
  createToken,
  verifyToken,
  createPasswordResetToken,
};
