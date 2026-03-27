export type EventStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type EventCategory = 'CLUB' | 'FESTIVAL' | 'BEACH' | 'CONCERT' | 'SPORT' | 'CULTUREL' | 'RANDONNEE' | 'AUTRE';
export type OfferType = 'STANDARD' | 'INTERMEDIAIRE' | 'PREMIUM';

export interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  quantityTotal: number;
  quantitySold: number;
  quantityReserved: number;
  maxPerOrder: number;
  isVisible: boolean;
  sortOrder: number;
}

export interface Organizer {
  id?: string;
  companyName: string;
  logoUrl: string | null;
  description: string | null;
  isApproved?: boolean;
  isCertified?: boolean;
}

export interface Event {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  category: EventCategory;
  status: EventStatus;
  coverImageUrl: string | null;
  galleryUrls: string[];
  eventDate: string;
  doorsOpenAt: string | null;
  endDate: string | null;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueLatitude: number | null;
  venueLongitude: number | null;
  isFeatured: boolean;
  isHot: boolean;
  isCertified: boolean;
  offer: OfferType;
  commissionRate: number;
  maxTicketsPerOrder: number;
  organizer: Organizer;
  ticketCategories: TicketCategory[];
}

export interface EventFilters {
  category?: EventCategory;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
  timeframe?: 'upcoming' | 'past';
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedEvents {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
