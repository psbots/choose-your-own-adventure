
import React, { useEffect, useState } from 'react';

const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const confettiColors = ['bg-yellow-300', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-red-400'];
    const newPieces = Array.from({ length: 150 }).map((_, i) => {
      const style: React.CSSProperties = {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        transform: `rotate(${Math.random() * 360}deg)`,
      };
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const animationDuration = `${Math.random() * 3 + 4}s`; // 4 to 7 seconds

      return (
        <div
          key={i}
          className={`absolute top-[-10%] w-2 h-4 rounded-full ${color} animate-fall`}
          style={{ ...style, animationDuration }}
        />
      );
    });

    setPieces(newPieces);

    // This is to add keyframes dynamically, as Tailwind doesn't support this out of the box
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes fall {
        0% { transform: translateY(0) rotate(0); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
      .animate-fall {
        animation-name: fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-50">{pieces}</div>;
};

export default Confetti;
