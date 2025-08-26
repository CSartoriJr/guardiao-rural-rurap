
import PageWrapper from '@/components/shared/PageWrapper';
import TecnicoRequestForm from '@/components/tecnico/TecnicoRequestForm';

export default function TecnicoSubmitRequestPage() {
  return (
    <PageWrapper allowedRoles={['tecnico']}>
      <TecnicoRequestForm />
    </PageWrapper>
  );
}
