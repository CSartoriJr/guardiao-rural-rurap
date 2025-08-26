
import PageWrapper from '@/components/shared/PageWrapper';
import FarmerRegistrationByTechnicianForm from '@/components/technician/FarmerRegistrationByTechnicianForm';

export default function RegisterFarmerByTechnicianPage() {
  return (
    <PageWrapper allowedRoles={['technician']}>
      <FarmerRegistrationByTechnicianForm />
    </PageWrapper>
  );
}
