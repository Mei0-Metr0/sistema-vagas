import { useState } from 'react';

const MultiplierForm = ({ onSubmit, loading, disabled = false }) => {
  const [multiplier, setMultiplier] = useState(1.0);

  const handleChange = (e) => {
    setMultiplier(parseFloat(e.target.value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(multiplier);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="fator-multiplicacao" className="form-label">Fator de multiplicação</label>
      <input 
        type="range" 
        className="form-range" 
        min="1" 
        max="5" 
        step="0.1" 
        value={multiplier}
        id="fator-multiplicacao"
        onChange={handleChange}
        disabled={loading || disabled}
      />
      <div className="text-center">
        <span id="fator-value">{multiplier.toFixed(1)}</span>
      </div>
      {disabled && (
        <div className="text-center text-muted small mt-1">
          O fator é fixo em 1x para a 1ª chamada.
        </div>
      )}
    </form>
  );
};

export default MultiplierForm;