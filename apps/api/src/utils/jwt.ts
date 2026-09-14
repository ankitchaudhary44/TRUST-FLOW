import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

export const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; role: string };
};
