import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventTrackCard } from '../../pages/Events';
import type { Event } from '../../types/event';

const baseEvent: Event = {
  id: 'event-006',
  title: 'DISICK Valentine Night 2026',
  subtitle: null,
  description: 'Soirée spéciale Saint-Valentin.',
  category: 'CLUB',
  status: 'COMPLETED',
  coverImageUrl: null,
  galleryUrls: [],
  eventDate: '2026-02-14T22:00:00.000Z',
  doorsOpenAt: null,
  endDate: null,
  venueName: 'Club Le Diamond',
  venueAddress: 'Boulevard Triomphal, Libreville',
  venueCity: 'Libreville',
  venueLatitude: null,
  venueLongitude: null,
  isFeatured: false,
  isHot: false,
  isCertified: false,
  offer: 'STANDARD',
  commissionRate: 0.07,
  operatorFeeMode: 'TRANSPARENT',
  promoEnabled: false,
  maxTicketsPerOrder: 10,
  organizer: { companyName: 'DISICK Man Show', logoUrl: null, description: null },
  ticketCategories: [
    { id: 'cat-006-std', eventId: 'event-006', name: 'Standard', description: null, price: 5000, quantityTotal: 300, quantitySold: 215, quantityReserved: 0, maxPerOrder: 10, isVisible: true, sortOrder: 1 },
    { id: 'cat-006-vip', eventId: 'event-006', name: 'VIP', description: null, price: 15000, quantityTotal: 50, quantitySold: 38, quantityReserved: 0, maxPerOrder: 10, isVisible: true, sortOrder: 2 },
  ],
};

function renderCard(isPast: boolean) {
  return render(
    <MemoryRouter>
      <EventTrackCard event={baseEvent} isPast={isPast} />
    </MemoryRouter>,
  );
}

describe('EventTrackCard — confidentialité des ventes sur événements passés', () => {
  it("n'affiche aucun nombre de billets vendus pour un événement terminé", () => {
    renderCard(true);

    expect(screen.getByText('Terminé')).toBeInTheDocument();
    // Le total (215 + 38 = 253) ne doit apparaître nulle part dans la carte —
    // c'est une donnée commerciale privée de l'organisateur.
    expect(screen.queryByText(/253/)).not.toBeInTheDocument();
    expect(screen.queryByText(/billets vendus/i)).not.toBeInTheDocument();
  });

  it("n'affiche pas le badge « Terminé » ni le total de ventes pour un événement à venir", () => {
    renderCard(false);

    expect(screen.queryByText('Terminé')).not.toBeInTheDocument();
    expect(screen.queryByText(/billets vendus/i)).not.toBeInTheDocument();
  });
});
