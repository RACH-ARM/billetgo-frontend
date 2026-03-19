import { useState } from 'react';
import { ticketService } from '../../services/ticketService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

export default function PDFDownload({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await ticketService.downloadTicketPDF(ticketId);
      toast.success('Ticket téléchargé !');
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload} isLoading={loading}>
      Télécharger PDF
    </Button>
  );
}
