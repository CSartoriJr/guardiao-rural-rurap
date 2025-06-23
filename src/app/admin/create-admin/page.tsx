
import PageWrapper from '@/components/shared/PageWrapper';
import CreateAdminForm from '@/components/admin/CreateAdminForm';

export default function CreateAdminPage() {
  return (
    <PageWrapper allowedRoles={['admin']}>
      <CreateAdminForm />
    </PageWrapper>
  );
}
