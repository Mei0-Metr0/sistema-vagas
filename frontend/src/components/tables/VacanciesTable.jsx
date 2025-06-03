const VacanciesTable = ({ data, headers }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {headers.map(header => (
                <td key={`${index}-${header}`}>
                  {item && item[header] !== undefined ? item[header] : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VacanciesTable;