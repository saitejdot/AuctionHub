import React from 'react';
import useCountdown from '../../hooks/useCountdown';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ endTime, className = '' }) => {
  const { display, expired, hours, minutes } = useCountdown(endTime);

  const isUrgent = !expired && hours === 0 && minutes < 30;

  return (
    <div className={`flex items-center gap-1.5 font-mono font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-700'} ${className}`}>
      <Clock size={15} className={isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-500'} />
      <span>{display}</span>
    </div>
  );
};

export default CountdownTimer;
