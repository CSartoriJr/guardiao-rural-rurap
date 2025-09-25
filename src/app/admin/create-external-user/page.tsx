import PageWrapper from '@/components/shared/PageWrapper';
import CreateExternalUserForm from '@/components/admin/CreateExternalUserForm';

export default function CreateExternalUserPage() {
  return (
    <PageWrapper allowedRoles={['admin']}>
      <CreateExternalUserForm />
    </PageWrapper>
  );
}
