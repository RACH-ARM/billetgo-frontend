export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'NONE';
export type CommissionType = 'PERCENTAGE' | 'FIXED';
export type PromoUseStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type InfluencerPayoutStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface PromoCode {
  id: string;
  eventId: string;
  code: string;
  label: string | null;
  discountType: DiscountType;
  discountValue: number;
  commissionType: CommissionType;
  commissionValue: number;
  isActive: boolean;
  clickCount: number;
  influencer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  stats: {
    usageCount: number;
    ticketsSold: number;
    totalCommission: number;
    pendingCommission: number;
  };
}

export interface PromoValidation {
  promoCodeId: string;
  code: string;
  label: string | null;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  newTotal: number;
}

export interface InfluencerCampaign {
  promoCodeId: string;
  code: string;
  label: string | null;
  isActive: boolean;
  clickCount: number;
  discountType: DiscountType;
  discountValue: number;
  commissionType: CommissionType;
  commissionValue: number;
  event: {
    id: string;
    title: string;
    eventDate: string;
    coverImageUrl: string | null;
  };
  stats: {
    usageCount: number;
    ticketsSold: number;
    revenueGenerated: number;
    commissionConfirmed: number;
    commissionPending: number;
  };
}

export interface InfluencerPayout {
  id: string;
  amount: number;
  phoneNumber: string;
  operator: 'AIRTEL_MONEY' | 'MOOV_MONEY';
  status: InfluencerPayoutStatus;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface InfluencerDashboardData {
  summary: {
    totalClicks: number;
    totalTickets: number;
    totalConfirmed: number;
    totalPending: number;
    totalPaid: number;
    pendingPayouts: number;
    availableBalance: number;
  };
  campaigns: InfluencerCampaign[];
  payouts: InfluencerPayout[];
}
