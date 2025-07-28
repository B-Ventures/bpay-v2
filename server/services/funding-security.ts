import { db } from "../db";
import { users, fundingSources, kycVerifications } from "@shared/schema";
import { eq, count, desc } from "drizzle-orm";

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    maxFundingSources: 2,
    requiresNameVerification: true,
    kycBonusSources: 1, // +1 source after KYC verification
    kycRelaxesNameCheck: true, // KYC allows non-matching names
    feePercentage: 2.9 // Standard fee rate
  },
  pro: {
    maxFundingSources: 5,
    requiresNameVerification: false,
    kycBonusSources: 0, // No additional bonus for paid tiers
    kycRelaxesNameCheck: false,
    feePercentage: 2.9 // Same fees as free - value is in enhanced features
  },
  premium: {
    maxFundingSources: -1, // unlimited
    requiresNameVerification: false,
    kycBonusSources: 0,
    kycRelaxesNameCheck: false,
    feePercentage: 1.9 // Premium gets reduced transaction fees
  }
} as const;

// Name similarity check - basic implementation
export function checkNameSimilarity(userName: string, cardholderName: string): boolean {
  if (!userName || !cardholderName) return false;
  
  // Normalize names: remove extra spaces, convert to lowercase
  const normalizeTitle = (name: string) => 
    name.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[^\w\s-']/g, ''); // Remove special chars except hyphens and apostrophes

  const userNormalized = normalizeTitle(userName);
  const cardNormalized = normalizeTitle(cardholderName);

  // Direct match
  if (userNormalized === cardNormalized) return true;

  // Split into parts and check for significant overlap
  const userParts = userNormalized.split(' ').filter(part => part.length > 1);
  const cardParts = cardNormalized.split(' ').filter(part => part.length > 1);

  if (userParts.length === 0 || cardParts.length === 0) return false;

  // Check if at least 2 parts match or if it's a single name that matches
  let matchingParts = 0;
  for (const userPart of userParts) {
    if (cardParts.some(cardPart => 
      cardPart === userPart || 
      (userPart.length > 3 && cardPart.includes(userPart)) ||
      (cardPart.length > 3 && userPart.includes(cardPart))
    )) {
      matchingParts++;
    }
  }

  // For single names, require exact match. For multiple names, require at least 2 matches
  if (userParts.length === 1 && cardParts.length === 1) {
    return matchingParts >= 1;
  }
  
  return matchingParts >= Math.min(2, Math.min(userParts.length, cardParts.length));
}

// Validate funding source creation based on user's subscription tier and KYC status
export async function validateFundingSourceCreation(
  userId: string, 
  cardholderName: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Get user details including subscription tier and KYC status
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    // Check KYC verification status
    const [kycRecord] = await db.select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(1);

    const isKycVerified = kycRecord?.status === 'approved';

    // Get current funding sources count
    const [{ count: currentCount }] = await db.select({ count: count() })
      .from(fundingSources)
      .where(eq(fundingSources.userId, userId));

    const tier = user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS || 'free';
    const limits = SUBSCRIPTION_LIMITS[tier];

    // Calculate effective limits with KYC bonuses
    const effectiveMaxSources = limits.maxFundingSources === -1 ? -1 : 
      limits.maxFundingSources + (isKycVerified ? limits.kycBonusSources : 0);
    
    const effectiveNameCheck = limits.requiresNameVerification && 
      !(isKycVerified && limits.kycRelaxesNameCheck);

    // Check funding source limit (including KYC bonus)
    if (effectiveMaxSources !== -1 && currentCount >= effectiveMaxSources) {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
      const baseMessage = `${tierName} tier allows maximum ${limits.maxFundingSources} funding sources.`;
      
      if (isKycVerified && limits.kycBonusSources > 0) {
        return { 
          isValid: false, 
          error: `${baseMessage} You've already used your +${limits.kycBonusSources} ID verification bonus. Upgrade your plan to add more.` 
        };
      } else if (!isKycVerified && limits.kycBonusSources > 0) {
        return { 
          isValid: false, 
          error: `${baseMessage} Complete ID verification to unlock ${limits.kycBonusSources} additional funding source, or upgrade your plan.` 
        };
      } else {
        return { 
          isValid: false, 
          error: `${baseMessage} Upgrade your plan to add more.` 
        };
      }
    }

    // Check name verification requirement (relaxed for KYC-verified users)
    if (effectiveNameCheck) {
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      
      if (!userFullName) {
        return { 
          isValid: false, 
          error: "Complete your profile with first and last name before adding funding sources." 
        };
      }

      if (!checkNameSimilarity(userFullName, cardholderName)) {
        return { 
          isValid: false, 
          error: "The name on the funding source must match your account name for security purposes. Complete ID verification to add sources in other names." 
        };
      }
    }

    return { isValid: true };

  } catch (error) {
    console.error("Funding source validation error:", error);
    return { isValid: false, error: "Validation failed. Please try again." };
  }
}

// Get subscription tier benefits for display (including KYC bonuses)
export async function getSubscriptionBenefits(userId: string, tier: string) {
  const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.free;
  
  // Check KYC verification status if user ID provided
  let isKycVerified = false;
  if (userId) {
    try {
      const [kycRecord] = await db.select()
        .from(kycVerifications)
        .where(eq(kycVerifications.userId, userId))
        .orderBy(desc(kycVerifications.createdAt))
        .limit(1);
      
      isKycVerified = kycRecord?.status === 'approved';
    } catch (error) {
      console.error("Error checking KYC status:", error);
    }
  }

  // Calculate effective limits with KYC bonuses
  const effectiveMaxSources = limits.maxFundingSources === -1 ? -1 : 
    limits.maxFundingSources + (isKycVerified ? limits.kycBonusSources : 0);
  
  const effectiveNameCheck = limits.requiresNameVerification && 
    !(isKycVerified && limits.kycRelaxesNameCheck);

  const features = [
    `${effectiveMaxSources === -1 ? 'Unlimited' : effectiveMaxSources} funding sources`,
    effectiveNameCheck ? 'Name verification required' : 'Any cardholder name allowed',
    `${limits.feePercentage}% transaction fees`
  ];

  // Add KYC-specific features for free tier
  if (tier === 'free') {
    if (isKycVerified) {
      features.push('✓ ID Verification Bonus: +1 funding source');
      if (limits.kycRelaxesNameCheck) {
        features.push('✓ Can add sources in other names');
      }
    } else if (limits.kycBonusSources > 0) {
      features.push(`🔒 Complete ID verification for +${limits.kycBonusSources} funding source`);
      features.push('🔒 Add sources in other names after verification');
    }
  }

  // Add tier-specific value propositions
  if (tier === 'pro') {
    features.push('Enhanced payment processing features');
    features.push('Priority customer support');
  } else if (tier === 'premium') {
    features.push('Lowest transaction fees available');
    features.push('Advanced analytics and reporting');
    features.push('White-label integration options');
  }
  
  return {
    maxFundingSources: effectiveMaxSources,
    nameVerificationRequired: effectiveNameCheck,
    tierDisplayName: tier.charAt(0).toUpperCase() + tier.slice(1),
    isKycVerified,
    features,
    feePercentage: limits.feePercentage
  };
}