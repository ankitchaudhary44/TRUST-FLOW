import prisma from '../config/db';
import { analyzeSecuritySequence } from './security.engine';
import { analyzeRelationalGraph } from './graph.engine';
import { evaluateAgentTransaction } from './agent.engine';
import axios from 'axios';

export interface TransactionContext {
  userId: string;
  amount: number;
  beneficiaryId?: string;
  deviceId?: string;
  isNewBeneficiary: boolean;
  isNewDevice: boolean;
  timeOfDay: number; // Hour of the day (0-23)
  
  // Agentic Security Context
  agentId?: string;
  merchantCategory?: string;
  merchantId?: string;
}

export interface RiskResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primaryReason: string;
  factors: Array<{ name: string; contribution: number }>;
}

export const evaluateTransactionRisk = async (context: TransactionContext): Promise<RiskResult> => {
  let riskScore = 0;
  const factors: Array<{ name: string; contribution: number }> = [];
  let amountDeviation = 1;

  // 1. Fetch Customer Baseline
  const baseline = await prisma.customerBaseline.findUnique({
    where: { userId: context.userId }
  });

  if (baseline) {
    amountDeviation = context.amount / baseline.medianAmount;
    if (amountDeviation > 10) {
      riskScore += 35;
      factors.push({ name: 'Amount significantly exceeds baseline', contribution: 35 });
    } else if (amountDeviation > 5) {
      riskScore += 20;
      factors.push({ name: 'Amount exceeds baseline', contribution: 20 });
    }
  }

  // 2. Beneficiary Risk & Threat Intel
  if (context.isNewBeneficiary) {
    riskScore += 25;
    factors.push({ name: 'New Beneficiary', contribution: 25 });
  }

  const blacklistedKeywords = ['hacker', 'scam', 'fraud', 'test-leak', 'darkweb'];
  if (blacklistedKeywords.some(kw => context.beneficiaryId?.toLowerCase().includes(kw))) {
    riskScore += 80;
    factors.push({ name: 'Threat Intel: Blacklisted Entity Match', contribution: 80 });
  }

  // 3. Device Risk
  if (context.isNewDevice) {
    riskScore += 20;
    factors.push({ name: 'Unrecognized Device', contribution: 20 });
  }

  // 4. Time Anomaly
  if (context.timeOfDay >= 1 && context.timeOfDay <= 5) {
    riskScore += 15;
    factors.push({ name: 'Unusual Transaction Time', contribution: 15 });
  }

  // 5. ML Pipeline Integration (SHAP Explainability)
  try {
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/api/v1/evaluate`, {
      amount_deviation: amountDeviation,
      is_new_beneficiary: context.isNewBeneficiary ? 1 : 0,
      is_new_device: context.isNewDevice ? 1 : 0,
      time_of_day: context.timeOfDay
    });

    const mlData = mlResponse.data;
    if (mlData && mlData.ml_risk_score > 0) {
      const mlContribution = Math.floor(mlData.ml_risk_score / 2);
      riskScore += mlContribution;
      
      if (mlData.feature_contributions) {
        Object.keys(mlData.feature_contributions).forEach(feature => {
          factors.push({
            name: `AI: ${feature} (${mlData.feature_contributions[feature]}% contribution)`,
            contribution: Math.floor(mlData.feature_contributions[feature] / 2)
          });
        });
      } else {
        factors.push({ name: 'AI Anomaly Model detected high probability of fraud', contribution: mlContribution });
      }
    }
  } catch (error) {
    console.warn('ML Service unavailable, falling back to rule-based engine only.');
  }

  // 6. Relational Graph Intelligence (PostgreSQL)
  const graphAnalysis = await analyzeRelationalGraph(context.userId, context.deviceId, context.beneficiaryId);
  if (graphAnalysis.hasAnomaly) {
    riskScore += graphAnalysis.riskPenalty;
    graphAnalysis.patterns.forEach(pattern => {
      factors.push({ name: `Graph Anomaly: ${pattern}`, contribution: graphAnalysis.riskPenalty });
    });
  }

  // 7. Temporal Sequence Detection (Account Takeover Signals)
  const securityAnalysis = await analyzeSecuritySequence(context.userId);
  if (securityAnalysis.isCompromised) {
    riskScore += 50;
    factors.push({ name: 'Account Takeover Pattern Detected', contribution: 50 });
    securityAnalysis.detectedPatterns.forEach(pattern => {
      factors.push({ name: `Sequence: ${pattern}`, contribution: 0 });
    });
  } else if (securityAnalysis.threatLevel === 'ELEVATED') {
    riskScore += 25;
    factors.push({ name: 'Elevated Security Threat Level', contribution: 25 });
  }

  // 8. Agentic Security Module
  if (context.agentId) {
    const agentAnalysis = await evaluateAgentTransaction({
      agentId: context.agentId,
      requestedAmount: context.amount,
      merchantCategory: context.merchantCategory || 'Unknown',
      merchantId: context.merchantId || context.beneficiaryId || 'Unknown'
    });

    if (!agentAnalysis.isAuthorized) {
      riskScore += agentAnalysis.riskPenalty;
      factors.push({ 
        name: `Agent Blocked: ${agentAnalysis.blockReason}`, 
        contribution: agentAnalysis.riskPenalty 
      });
    }
  }

  // Determine Risk Level
  let riskLevel: RiskResult['riskLevel'] = 'LOW';
  let primaryReason = 'Normal behavior pattern';

  if (riskScore >= 86) {
    riskLevel = 'CRITICAL';
    primaryReason = 'Multiple high-risk anomalies or Account Takeover pattern detected';
  } else if (riskScore >= 61) {
    riskLevel = 'HIGH';
    primaryReason = factors.length > 0 ? factors[0].name : 'Elevated risk pattern';
  } else if (riskScore >= 31) {
    riskLevel = 'MEDIUM';
    primaryReason = 'Slight deviation from normal behavior';
  }

  const finalScore = Math.min(riskScore, 100);

  return {
    riskScore: finalScore,
    riskLevel,
    primaryReason,
    factors
  };
};
