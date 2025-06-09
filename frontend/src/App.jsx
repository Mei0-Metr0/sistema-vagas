import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store/store';

import FilterSection from './components/sections/FilterSection';
import VacancyDistributionSection from './components/sections/VacancyDistributionSection';
import CsvUploadSection from './components/sections/CsvUploadSection';
import CallGenerationSection from './components/sections/CallGenerationSection';
import NonApprovedSection from './components/sections/NonApprovedSection';

import { resetCandidates } from './store/slices/candidatesSlice';
import { resetCall } from './store/slices/callSlice';
import { resetVacancies } from './store/slices/vacanciesSlice';
import { resetUi } from './store/slices/uiSlice';

import './styles/main.css';

function AppContent() {
  const dispatch = useDispatch();

  const workflowStep = useSelector(state => state.ui.workflowStep);

  const handleResetSystem = async () => {
    if (window.confirm("Tem certeza que deseja resetar todo o sistema? Todos os dados carregados, distribuição de vagas e chamadas geradas serão perdidos.")) {
      try {
        const response = await fetch('/api/v1/chamadas/reset-sistema', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const responseData = await response.json();

        if (response.ok && responseData.status === 'success') {
          dispatch(resetCandidates());
          dispatch(resetCall());
          dispatch(resetVacancies());
          dispatch(resetUi());

          alert("Sistema resetado com sucesso! A página será recarregada.");
          window.location.reload();
        } else {
          alert(`Erro ao resetar o sistema no servidor: ${responseData.detail || responseData.message || 'Erro desconhecido.'}`);
        }
      } catch (error) {
        console.error("Falha ao tentar resetar o sistema:", error);
        alert("Falha na comunicação com o servidor ao tentar resetar o sistema.");
      }
    }
  };

  return (
    <div className="container">
      <header className="app-header my-4">
        <div className="header-left">
          <img src="/logo.png" alt="Logo UTFPR" className="app-logo" />
        </div>
        <div className="title-group display-flex flex-column align-items-center">
          <h1 className="titulo-principal">Sistema de Distribuição de Vagas</h1>
          <p className="subtitulo">Distribuição de vagas em cumprimento à Lei 14.723/2023</p>
        </div>
        <div className="header-right">
          <button
            onClick={handleResetSystem}
            className="btn btn-danger reset-button"
          >
            RESETAR SISTEMA
          </button>
        </div>
      </header>

      {/* Passo 1: Upload - Sempre visível no início */}
      <CsvUploadSection />

      {/* Passo 2: Filtro - Visível apenas após o upload ser concluído */}
      {workflowStep === 'upload-complete' && <FilterSection />}

      {/* Passos 3 e 4: Vagas e Chamada - Visíveis apenas após o filtro ser aplicado */}
      {workflowStep === 'filter-applied' && (
        <>
          <VacancyDistributionSection />
          <CallGenerationSection />
          <NonApprovedSection />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;