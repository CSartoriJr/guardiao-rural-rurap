
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestForm from '@/components/technician/TechnicianRequestForm';

export default function TechnicianSubmitRequestPage() {
  return (
    <PageWrapper allowedRoles={['technician']}>
      <TechnicianRequestForm />
    </PageWrapper>
  );
}
