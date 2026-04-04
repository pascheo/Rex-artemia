import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

const secret = process.env.JWT_SECRET ?? 'fallback_secret_change_in_production';
const expiry = process.env.JWT_EXPIRY ?? '8h';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: expiry } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
