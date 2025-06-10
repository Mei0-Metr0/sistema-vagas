import { useState } from 'react';

const MultiplierForm = ({ onSubmit, loading }) => {
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
      />
      <div className="text-center">
        <span id="fator-value">{multiplier}</span>
      </div>
    </form>
  );
};

export default MultiplierForm;