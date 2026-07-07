import React from 'react';

const BackgroundEffects = () => {
  return (
    <div className="background-effects" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -5, pointerEvents: 'none', overflow: 'hidden' }}>
      <div className="scenery-container">
        {[...Array(30)].map((_, i) => (
          <div key={i} className={`leaf leaf-${i}`} style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 10 + 5}s`,
            animationDelay: `${Math.random() * 10}s`
          }}>
            <svg viewBox="0 0 24 24" width={`${Math.random() * 15 + 10}px`} height={`${Math.random() * 15 + 10}px`} fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
            </svg>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .background-effects {
          background: linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%);
        }
        .leaf {
          position: absolute;
          top: -50px;
          color: rgba(0, 255, 204, 0.2);
          animation: fall linear infinite;
          transform-origin: center;
          filter: drop-shadow(0 0 10px rgba(0, 255, 204, 0.4));
        }
        @keyframes fall {
          0% {
            transform: translateY(-50px) rotate(0deg) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg) scale(1.2);
            opacity: 0;
          }
        }
        .leaf:nth-child(even) {
          color: rgba(255, 0, 127, 0.2);
          filter: drop-shadow(0 0 10px rgba(255, 0, 127, 0.4));
        }
        .leaf:nth-child(3n) {
          color: rgba(255, 215, 0, 0.15);
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3));
        }
      `}} />
    </div>
  );
};

export default BackgroundEffects;
