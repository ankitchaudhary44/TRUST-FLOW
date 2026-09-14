import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'CUSTOMER',
        trustState: 'NORMAL',
      },
    });

    // Auto-provision a banking account and risk baseline for new CUSTOMERS
    if (user.role === 'CUSTOMER') {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountNumber: 'ACC' + Math.floor(Math.random() * 1000000000).toString(),
          balance: 100000.0, // Give them 1 Lakh for testing
          currency: 'INR'
        }
      });
      await prisma.customerBaseline.create({
        data: {
          userId: user.id,
          medianAmount: 5000,
          stdDevAmount: 2000,
          typicalFrequency: 5
        }
      });
    }

    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role, trustState: user.trustState },
      ...tokens,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user.id, user.role);

    res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role, trustState: user.trustState },
      ...tokens,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user.id, user.role);
    res.status(200).json(tokens);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};
