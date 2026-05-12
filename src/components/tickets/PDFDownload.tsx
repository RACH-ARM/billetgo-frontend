import { ticketService } from '../../services/ticketService';
import Button from '../common/Button';

export default function PDFDownload({ ticketId }: { ticketId: string }) {
  const handleDownload = () => {
    ticketService.downloadTicketPDF(ticketId);
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload}>
      Télécharger PDF
    </Button>
  );
}
