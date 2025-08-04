import { SUBSCRIPTION_LIMITS } from "./funding-security";

/**
 * Fee calculation service that determines bpay transaction fees based on subscription tier
 */
export class FeeCalculator {
  
  /**
   * Get the fee percentage for a subscription tier
   */
  static getFeePercentage(subscriptionTier: string): number {
    const tier = subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS;
    const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free;
    return limits.feePercentage;
  }

  /**
   * Calculate bpay fees for a given amount and subscription tier
   */
  static calculateFees(amount: number, subscriptionTier: string): {
    baseAmount: number;
    feePercentage: number;
    feeAmount: number;
    totalAmount: number;
  } {
    const baseAmount = Number(amount);
    const feePercentage = this.getFeePercentage(subscriptionTier);
    const feeAmount = baseAmount * (feePercentage / 100);
    const totalAmount = baseAmount + feeAmount;

    return {
      baseAmount,
      feePercentage,
      feeAmount,
      totalAmount
    };
  }

  /**
   * Calculate required funding source amounts including fees
   */
  static calculateSplitAmounts(
    amount: number, 
    subscriptionTier: string, 
    splits: Array<{ percentage: number; fundingSourceId: number }>
  ): Array<{
    fundingSourceId: number;
    percentage: number;
    baseAmount: number;
    feeAmount: number;
    totalRequired: number;
  }> {
    const { feeAmount, totalAmount } = this.calculateFees(amount, subscriptionTier);
    const baseAmount = Number(amount);

    return splits.map(split => {
      const splitBaseAmount = (baseAmount * split.percentage) / 100;
      const splitFeeAmount = (feeAmount * split.percentage) / 100;
      const totalRequired = splitBaseAmount + splitFeeAmount;

      return {
        fundingSourceId: split.fundingSourceId,
        percentage: split.percentage,
        baseAmount: splitBaseAmount,
        feeAmount: splitFeeAmount,
        totalRequired
      };
    });
  }
}