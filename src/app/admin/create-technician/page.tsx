
import PageWrapper from '@/components/shared/PageWrapper';
import CreateTechnicianForm from '@/components/admin/CreateTechnicianForm';

export default function CreateTechnicianPage() {
  return (
    <PageWrapper allowedRoles={['admin']}>
      <CreateTechnicianForm />
    </PageWrapper>
  );
}
