const SortableTableHeader = ({ column, sortConfig, onSort }) => {
  const handleClick = () => {
    onSort(column);
  };

  const getSortIndicator = () => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <th 
      onClick={handleClick}
      className={sortConfig.key === column ? `sort-${sortConfig.direction}` : ''}
    >
      {column} {getSortIndicator()}
    </th>
  );
};

export default SortableTableHeader;