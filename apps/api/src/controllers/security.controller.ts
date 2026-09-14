import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { logSecurityEvent, analyzeSecuritySequence } from '../services/security.engine';

export const triggerEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventType, deviceId } = req.body;
    const userId = req.user!.userId;

    const event = await logSecurityEvent(userId, eventType, deviceId);
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Error logging security event:', error);
    res.status(500).json({ message: 'Error processing security event' });
  }
};

export const getSecurityTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const events = await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: { device: true }
    });

    const analysis = await analyzeSecuritySequence(userId);

    res.status(200).json({ events, analysis });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching security timeline' });
  }
};
