import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

/** Distinguishes refresh tokens from access tokens so a refresh token can never
 *  be replayed as an access token. */
const TOKEN_KIND_CLAIM = 'tokenKind';
type TokenKind = 'access' | 'refresh';

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: string;
  organizationId: string;
  tokenKind: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string;
  tokenKind: 'refresh';
}

/**
 * Resolves the signing secret, refusing to fall back to a hardcoded value.
 *
 * The previous implementation used `process.env.JWT_SECRET ||
 * 'your-secret-key-change-in-production'`, which meant a deployment that
 * forgot to set JWT_SECRET silently signed tokens with a publicly known key.
 */
function resolveSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new Error('JWT_SECRET is not configured');
  }

  if (process.env.NODE_ENV === 'production' && secret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed from its placeholder value in production');
  }

  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: {
  userId: string;
  role: string;
  organizationId: string;
}): string {
  return jwt.sign(
    { ...payload, tokenKind: 'access' as TokenKind },
    resolveSecret(),
    { expiresIn: JWT_EXPIRY },
  );
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(
    { userId: payload.userId, tokenKind: 'refresh' as TokenKind },
    resolveSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
}

function verify(token: string, expectedKind: TokenKind): JwtPayload {
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(token, resolveSecret()) as JwtPayload;
  } catch {
    throw new Error('Invalid token');
  }

  if (decoded.tokenKind !== expectedKind) {
    throw new Error('Invalid token');
  }

  return decoded;
}

/** Verifies an access token. Rejects refresh tokens. */
export function verifyToken(token: string): AccessTokenPayload {
  return verify(token, 'access') as AccessTokenPayload;
}

/** Verifies a refresh token. Rejects access tokens. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return verify(token, 'refresh') as RefreshTokenPayload;
}
