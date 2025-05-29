import { Provider } from 'react-redux';
import { store } from './store/store';
import VacancyDistributionSection from './components/sections/VacancyDistributionSection';
import CsvUploadSection from './components/sections/CsvUploadSection';
import CallGenerationSection from './components/sections/CallGenerationSection';
import NonApprovedSection from './components/sections/NonApprovedSection';
import './styles/main.css';

function App() {
  return (
    <Provider store={store}>
      <div className="container">
        <header className="my-4">
          <h1 className="text-center">🎓 Sistema de Distribuição de Vagas</h1>
          <p className="text-center">Distribuição de vagas em cumprimento à Lei 12.711/2012</p>
        </header>

        <VacancyDistributionSection />
        <CsvUploadSection />
        <CallGenerationSection />
        <NonApprovedSection />
      </div>
    </Provider>
  );
}

export default App;