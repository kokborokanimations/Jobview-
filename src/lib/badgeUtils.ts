/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, AdminSettings } from '../types';

export type UserBadgeType = 'PREMIUM' | 'TRIAL' | 'EXPIRED';

/**
 * Calculates the appropriate badge for a user based on Global Paywall Mode
 * and the user's account registration date (account age <= 15 days).
 */
export function getUserBadge(user: User | null, settings: AdminSettings): UserBadgeType | null {
  if (!user) return null;

  // Platform admin is always PREMIUM
  if (user.email.toLowerCase() === 'kokborokanimations@gmail.com') {
    return 'PREMIUM';
  }

  // 1. Global Paywall Mode = OFF:
  // All users should automatically get a "PREMIUM" badge.
  if (!settings.premiumMode) {
    return 'PREMIUM';
  }

  // If user is explicitly set to paid active membership
  if (user.subscriptionStatus === 'Active') {
    const planExpiryStr = user.plan_expiry_date || user.planExpiryDate;
    if (planExpiryStr) {
      const expiry = new Date(planExpiryStr);
      const now = new Date();
      if (now > expiry) {
        return 'EXPIRED';
      }
    }
    return 'PREMIUM';
  }

  if (user.subscriptionStatus === 'Expired') {
    return 'EXPIRED';
  }

  // 2. Global Paywall Mode = ON:
  // Check the user's registration date (created_at or joinDate).
  const regDateStr = (user as any).created_at || user.joinDate || (user as any).createdAt || new Date().toISOString();
  const regDate = new Date(regDateStr);
  const now = new Date();

  // Expiry date is strictly registration date + 15 days
  const expiryDate = new Date(regDate.getTime());
  expiryDate.setDate(expiryDate.getDate() + 15);

  // If the user's account age is LESS than or equal to 15 days, display "TRIAL" badge.
  // If the user's account age is MORE than 15 days, display "EXPIRED" badge.
  if (now <= expiryDate) {
    return 'TRIAL';
  } else {
    return 'EXPIRED';
  }
}

export interface TrialInfo {
  regDate: Date;
  expiryDate: Date;
  daysRemaining: number;
  isTrialActive: boolean;
}

/**
 * Calculates the trial information (registration date, expiry date, days remaining) for a user.
 * Trial duration is strictly 15 days.
 */
export function getTrialInfo(user: User | null): TrialInfo | null {
  if (!user) return null;

  const regDateStr = (user as any).created_at || user.joinDate || (user as any).createdAt || new Date().toISOString();
  const regDate = new Date(regDateStr);
  
  // Expiry date is strictly registration date + 15 days
  const expiryDate = new Date(regDate.getTime());
  expiryDate.setDate(expiryDate.getDate() + 15);

  const now = new Date();
  
  // Calculate remaining days
  const diffTime = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isTrialActive = now <= expiryDate;

  return {
    regDate,
    expiryDate,
    daysRemaining,
    isTrialActive
  };
}
