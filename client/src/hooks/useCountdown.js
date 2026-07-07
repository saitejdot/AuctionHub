import { useState, useEffect } from 'react';

/**
 * useCountdown hook — returns a countdown string for a given end time.
 * Updates every second. Returns 'Ended' when the time has passed.
 */
const useCountdown = (endTime) => {
  const calculateTimeLeft = () => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return { expired: true, display: 'Ended' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let display;
    if (days > 0) display = `${days}d ${hours}h ${minutes}m`;
    else if (hours > 0) display = `${hours}h ${minutes}m ${seconds}s`;
    else display = `${minutes}m ${seconds}s`;

    return { expired: false, display, days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    if (timeLeft.expired) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, timeLeft.expired]);

  return timeLeft;
};

export default useCountdown;
