const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`card mb-4 ${className} vacancy-distribution-section`}>
      <div className="card-header ">
        <h2>{title}</h2>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;