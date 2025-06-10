import { useState, useEffect, useRef } from 'react';
import '../../styles/components/searchableDropdown.css';

const SearchableDropdown = ({ options, value, onChange, placeholder = "Selecione..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectOption = (option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      <div className="dropdown-input-container" onClick={() => setIsOpen(!isOpen)}>
        <input
          type="text"
          className="form-control dropdown-input"
          placeholder={value === 'TODOS' ? placeholder : value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          value={isOpen ? searchTerm : (value === 'TODOS' ? '' : value)}
        />
        <span className="dropdown-caret">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className="dropdown-item"
                onClick={() => handleSelectOption(option)}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="dropdown-item disabled">Nenhum resultado</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;