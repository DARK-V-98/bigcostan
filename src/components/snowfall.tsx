
'use client';

import React, { useEffect, useState } from 'react';

const Snowfall: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateSnowflakes = () => {
      const newSnowflakes = Array.from({ length: 150 }).map((_, i) => {
        const style: React.CSSProperties = {
          left: `${Math.random() * 100}vw`,
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          animationDuration: `${Math.random() * 5 + 5}s`, // 5 to 10 seconds
          animationDelay: `${Math.random() * 5}s`,
          opacity: Math.random() * 0.7 + 0.3,
        };
        return <div key={i} className="snowflake" style={style}></div>;
      });
      setSnowflakes(newSnowflakes);
    };
    generateSnowflakes();
  }, []);

  return <>{snowflakes}</>;
};

export default Snowfall;
