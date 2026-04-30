export type TicketStatus = 'UNUSED' | 'USED' | 'CANCELLED' | 'REFUNDED';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentProvider = 'AIRTEL_MONEY' | 'MOOV_MONEY';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Ticket {
  id: string;
  categoryId: string;
  buyerId: string;
  orderId: string;
  qrCodeHash: string;
  qrCodeUrl: string | null;
  pdfUrl: string | null;
  status: TicketStatus;
  usedAt: string | null;
  createdAt: string;
  category: {
    name: string;
    price: number;
    event: {
      id: string;
      title: string;
      eventDate: string;
      coverImageUrl: string | null;
      venueName: string;
      venueAddress: string;
    };
  };
}

export interface OrderItem {
  id: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  category: { name: string };
}

export interface Order {
  id: string;
  buyerId: string;
  eventId: string;
  totalAmount: number;
  platformFee: number;
  organizerAmount: number;
  serviceFee: number;
  payinRate: number;
  status: OrderStatus;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    eventDate: string;
    coverImageUrl: string | null;
    venueName: string;
  };
  orderItems: OrderItem[];
  payments: { status: PaymentStatus; provider: PaymentProvider }[];
}

export interface CreateOrderPayload {
  eventId: string;
  items: { categoryId: string; quantity: number }[];
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  cgvAcceptedAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  provider?: 'AIRTEL_MONEY' | 'MOOV_MONEY';
}

export interface InitiatePaymentPayload {
  orderId: string;
  method: PaymentProvider;
  phone: string;
}
