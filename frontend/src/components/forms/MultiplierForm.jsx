import { useState } from 'react';

const MultiplierForm = ({ onSubmit, loading, disabled = false }) => {
  const [multiplier, setMultiplier] = useState(1);

  const handleChange = (e) => {
    setMultiplier(parseInt(e.target.value));
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
        step="1" 
        value={multiplier}
        id="fator-multiplicacao"
        onChange={handleChange}
        disabled={loading || disabled}
      />
      <div className="text-center">
        <span id="fator-value">{multiplier}</span>
      </div>
      {disabled && (
        <div className="text-center text-muted small mt-1">
          O FATOR É FIXO EM 1X PARA A 1ª CHAMADA.
        </div>
      )}
    </form>
  );
};

export default MultiplierForm;