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
          <h1 className="text-center titulo">Sistema de Distribuição de Vagas</h1>
          <p className="text-center titulo2">Distribuição de vagas em cumprimento à Lei 14.723/2023</p>
        </header>

        <CsvUploadSection />
        <VacancyDistributionSection />
        <CallGenerationSection />
        <NonApprovedSection />
      </div>
    </Provider>
  );
}

export default App;