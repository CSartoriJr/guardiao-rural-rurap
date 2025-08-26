
import PageWrapper from '@/components/shared/PageWrapper';
import CreateTecnicoForm from '@/components/admin/CreateTecnicoForm';

export default function CreateTecnicoPage() {
  return (
    <PageWrapper allowedRoles={['admin']}>
      <CreateTecnicoForm />
    </PageWrapper>
  );
}
