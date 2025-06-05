import { useEffect, useState } from 'react';

import '../../styles/components/alerts.css'; 

const Alert = ({ message, type = 'info', duration = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!visible || !message) return null;

  return (
    <div className={`alert-1 alert-${type}-1`}>
      {message}
    </div>
  );
};

export default Alert;