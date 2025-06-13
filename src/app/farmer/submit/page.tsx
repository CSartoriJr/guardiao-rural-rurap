import PageWrapper from '@/components/shared/PageWrapper';
import RequestForm from '@/components/farmer/RequestForm';

export default function SubmitRequestPage() {
  return (
    <PageWrapper allowedRoles={['farmer']}>
      <RequestForm />
    </PageWrapper>
  );
}
