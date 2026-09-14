import prisma from '../config/db';

export interface GraphAnomalyResult {
  hasAnomaly: boolean;
  patterns: string[];
  riskPenalty: number;
}

export const analyzeRelationalGraph = async (userId: string, deviceId?: string, beneficiaryId?: string): Promise<GraphAnomalyResult> => {
  const patterns: string[] = [];
  let riskPenalty = 0;
  
  try {
    // 1. Shared Device Anomaly (Same device used by multiple distinct users)
    if (deviceId) {
      const deviceUsers = await prisma.device.findMany({
        where: { id: deviceId },
        select: { userId: true }
      });
      
      const uniqueUsersOnDevice = new Set(deviceUsers.map(d => d.userId));
      
      if (uniqueUsersOnDevice.size > 2) {
        patterns.push(`Device shared across ${uniqueUsersOnDevice.size} different accounts (High Risk of Device Farm / ATO)`);
        riskPenalty += 40;
      } else if (uniqueUsersOnDevice.size === 2 && !uniqueUsersOnDevice.has(userId)) {
        patterns.push(`Device is registered to a different user account`);
        riskPenalty += 20;
      }
    }

    // 2. Beneficiary Mule Anomaly (Same beneficiary receiving funds from multiple distinct users rapidly)
    if (beneficiaryId) {
      // Find all transactions to this beneficiary in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const relatedTransactions = await prisma.transaction.findMany({
        where: { 
          beneficiaryId,
          timestamp: { gte: sevenDaysAgo },
          status: 'COMPLETED'
        },
        include: { sourceAccount: true }
      });
      
      const uniqueSenders = new Set(relatedTransactions.map(t => t.sourceAccount.userId));
      
      if (uniqueSenders.size > 3) {
        patterns.push(`Beneficiary has received funds from ${uniqueSenders.size} different users in 7 days (Money Mule Pattern)`);
        riskPenalty += 45;
      }
    }

    return {
      hasAnomaly: patterns.length > 0,
      patterns,
      riskPenalty
    };
  } catch (error) {
    console.error('Graph analysis failed:', error);
    return { hasAnomaly: false, patterns: [], riskPenalty: 0 };
  }
};
