import prisma from '../config/db';

export interface AgentContext {
  agentId: string;
  requestedAmount: number;
  merchantCategory: string;
  merchantId: string;
}

export interface AgentRiskResult {
  isAuthorized: boolean;
  blockReason?: string;
  riskPenalty: number;
}

export const evaluateAgentTransaction = async (context: AgentContext): Promise<AgentRiskResult> => {
  try {
    const auth = await prisma.agentAuthorization.findUnique({
      where: { id: context.agentId }
    });

    if (!auth || !auth.isActive) {
      return { isAuthorized: false, blockReason: 'Agent authorization not found or inactive', riskPenalty: 100 };
    }

    if (new Date() > auth.expiry) {
      return { isAuthorized: false, blockReason: 'Agent authorization expired', riskPenalty: 80 };
    }

    if (context.requestedAmount > auth.maximumTransactionAmount) {
      return { 
        isAuthorized: false, 
        blockReason: `Amount ₹${context.requestedAmount} exceeds agent limit of ₹${auth.maximumTransactionAmount}`, 
        riskPenalty: 60 
      };
    }

    const authCats = auth.authorizedCategories.split(',');
    if (!authCats.includes(context.merchantCategory) && authCats.length > 0 && !authCats.includes('*')) {
      return { 
        isAuthorized: false, 
        blockReason: `Category '${context.merchantCategory}' is explicitly unauthorized for this agent`, 
        riskPenalty: 85 
      };
    }

    const authMerch = auth.allowedMerchants.split(',');
    if (authMerch.length > 0 && !authMerch.includes('*') && !authMerch.includes(context.merchantId)) {
      return {
        isAuthorized: false,
        blockReason: `Merchant '${context.merchantId}' is not in the agent's allowed list`,
        riskPenalty: 85
      };
    }

    return { isAuthorized: true, riskPenalty: 0 };
  } catch (error) {
    console.error('Agent Engine Error:', error);
    return { isAuthorized: false, blockReason: 'System error during agent evaluation', riskPenalty: 100 };
  }
};
