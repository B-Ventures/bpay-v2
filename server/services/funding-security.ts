import { db } from "../db";
import { users, fundingSources } from "@shared/schema";
import { eq, count } from "drizzle-orm";

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    maxFundingSources: 2,
    requiresNameVerification: true
  },
  pro: {
    maxFundingSources: 5,
    requiresNameVerification: true
  },
  premium: {
    maxFundingSources: -1, // unlimited
    requiresNameVerification: false
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

// Validate funding source creation based on user's subscription tier
export async function validateFundingSourceCreation(
  userId: string, 
  cardholderName: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Get user details including subscription tier
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    // Get current funding sources count
    const [{ count: currentCount }] = await db.select({ count: count() })
      .from(fundingSources)
      .where(eq(fundingSources.userId, userId));

    const tier = user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS || 'free';
    const limits = SUBSCRIPTION_LIMITS[tier];

    // Check funding source limit
    if (limits.maxFundingSources !== -1 && currentCount >= limits.maxFundingSources) {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
      return { 
        isValid: false, 
        error: `${tierName} tier allows maximum ${limits.maxFundingSources} funding sources. Upgrade your plan to add more.` 
      };
    }

    // Check name verification requirement
    if (limits.requiresNameVerification) {
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
          error: "The name on the funding source must match your account name for security purposes." 
        };
      }
    }

    return { isValid: true };

  } catch (error) {
    console.error("Funding source validation error:", error);
    return { isValid: false, error: "Validation failed. Please try again." };
  }
}

// Get subscription tier benefits for display
export function getSubscriptionBenefits(tier: string) {
  const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.free;
  
  return {
    maxFundingSources: limits.maxFundingSources === -1 ? 'Unlimited' : limits.maxFundingSources.toString(),
    nameVerificationRequired: limits.requiresNameVerification,
    tierDisplayName: tier.charAt(0).toUpperCase() + tier.slice(1)
  };
}