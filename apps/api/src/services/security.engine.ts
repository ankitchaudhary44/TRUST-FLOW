import prisma from '../config/db';

export interface SequenceAnalysisResult {
  isCompromised: boolean;
  threatLevel: 'NONE' | 'ELEVATED' | 'CRITICAL';
  detectedPatterns: string[];
}

export const analyzeSecuritySequence = async (userId: string): Promise<SequenceAnalysisResult> => {
  // Fetch security events from the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const events = await prisma.securityEvent.findMany({
    where: {
      userId,
      timestamp: { gte: twentyFourHoursAgo }
    },
    orderBy: { timestamp: 'asc' }
  });

  if (events.length === 0) {
    return { isCompromised: false, threatLevel: 'NONE', detectedPatterns: [] };
  }

  const eventTypes = events.map(e => e.eventType);
  const detectedPatterns: string[] = [];
  let threatLevel: 'NONE' | 'ELEVATED' | 'CRITICAL' = 'NONE';
  let isCompromised = false;

  // Pattern 1: Classic Account Takeover (ATO) Sequence
  // Password Change -> New Device -> Beneficiary Added -> High Value Transfer
  if (
    eventTypes.includes('PASSWORD_CHANGE') && 
    eventTypes.includes('NEW_DEVICE') && 
    eventTypes.includes('BENEFICIARY_ADDED')
  ) {
    detectedPatterns.push('Classic Account Takeover Sequence Detected (Password Reset + New Device + New Beneficiary)');
    threatLevel = 'CRITICAL';
    isCompromised = true;
  }

  // Pattern 2: Multiple Failed Logins followed by Success on New Device
  const failedLogins = events.filter(e => e.eventType === 'FAILED_LOGIN').length;
  if (failedLogins >= 3 && eventTypes.includes('NEW_DEVICE')) {
    detectedPatterns.push('Brute-force attempt followed by new device login');
    threatLevel = 'CRITICAL';
    isCompromised = true;
  }

  // Pattern 3: Rapid Profile Modification
  const profileChanges = events.filter(e => e.eventType === 'MFA_CHANGE' || e.eventType === 'PASSWORD_CHANGE').length;
  if (profileChanges >= 2 && eventTypes.includes('TRANSACTION_LIMIT_CHANGED')) {
    detectedPatterns.push('Rapid security profile modification followed by limit change');
    threatLevel = 'ELEVATED';
  }

  return { isCompromised, threatLevel, detectedPatterns };
};

export const logSecurityEvent = async (userId: string, eventType: string, deviceId?: string) => {
  const event = await prisma.securityEvent.create({
    data: {
      userId,
      eventType,
      deviceId
    }
  });

  // Automatically trigger a sequence analysis upon critical event types
  if (['PASSWORD_CHANGE', 'MFA_CHANGE', 'NEW_DEVICE', 'BENEFICIARY_ADDED'].includes(eventType)) {
    const analysis = await analyzeSecuritySequence(userId);
    
    if (analysis.isCompromised) {
      // Update user trust state
      await prisma.user.update({
        where: { id: userId },
        data: { trustState: 'CRITICAL' }
      });
    } else if (analysis.threatLevel === 'ELEVATED') {
      await prisma.user.update({
        where: { id: userId },
        data: { trustState: 'HIGH RISK' }
      });
    }
  }

  return event;
};
