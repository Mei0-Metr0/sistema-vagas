import CotaDistributionForm from '../forms/CotaDistributionForm';

const VacancyDistributionSection = () => {
  return (
    <section className="card mb-4">
      <div className="card-header">
        <h2>1. Informar a distribuição das cotas</h2>
      </div>
      <div className="card-body">
        <CotaDistributionForm />
      </div>
    </section>
  );
};

export default VacancyDistributionSection;