import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2800);

    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 3300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ${isFadingOut ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}
         style={{
           background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #ecfdf5 100%)'
         }}>
      
      {/* Animated background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-emerald-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-gradient-to-br from-sky-200/30 to-sky-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-[40%] right-[10%] w-64 h-64 bg-gradient-to-br from-emerald-100/40 to-sky-100/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.8s' }}></div>
      
      {/* Subtle grocery pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20 Q25 10 30 20 T40 20' stroke='%2310b981' fill='none' stroke-width='1'/%3E%3Ccircle cx='35' cy='25' r='5' stroke='%230ea5e9' fill='none' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative flex flex-col items-center">
        {/* Logo Container with enhanced animations */}
        <div className="relative w-36 h-36 mb-8 group">
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-sky-400/0 animate-spin-slow"></div>
          <div className="absolute inset-[-8px] rounded-[2.5rem] bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-sky-500/0 animate-spin-slower"></div>
          
          {/* Pulsing glow */}
          <div className="absolute inset-0 bg-emerald-400/20 rounded-[2rem] blur-xl animate-pulse-glow"></div>
          
          {/* Floating logo */}
          <div className="relative w-full h-full bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-2xl border-2 border-white/50 flex items-center justify-center overflow-hidden animate-float-smooth">
            {/* Inner gradient shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 animate-shimmer"></div>
            
            <img 
              src="/android-chrome-192x192.png" 
              alt="JG Groceries Logo" 
              className="w-24 h-24 object-contain transform transition-transform duration-700 group-hover:scale-110 animate-bounce-soft"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Text Content with staggered fade-in */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-600 bg-clip-text text-transparent tracking-tight animate-fade-slide-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            JG Groceries
          </h1>
          <p className="text-slate-500 font-medium animate-fade-slide-up" 
             style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            Smart pantry, better meals.
          </p>
        </div>

        {/* Loading Bar with JG Shopping Cart */}
        <div className="mt-12 w-72 relative animate-fade-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          {/* Shopping Cart Track Area - Cart positioned above */}
          <div className="relative mb-8">
            {/* JG Shopping Cart that moves across */}
            <div className="absolute left-0 w-full animate-cart-move" style={{ top: '-30px' }}>
              <div className="relative inline-block">
                {/* JG Cart PNG Image - made larger */}
                <img 
                  src="/jg-cart.png"
                  alt="JG Shopping Cart"
                  className="w-20 h-20 object-contain transform -translate-x-1/2 animate-cart-wobble"
                  style={{
                    filter: 'drop-shadow(0 8px 12px rgba(16, 185, 129, 0.3))'
                  }}
                />
                {/* Enhanced wheel shadow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-emerald-900/20 rounded-full blur-md"></div>
              </div>
            </div>
          </div>

          {/* Receipt paper style track */}
          <div className="h-3 bg-white rounded-full border border-emerald-100 shadow-inner relative overflow-hidden">
            {/* Animated gradient progress */}
            <div className="absolute inset-0 rounded-full animate-loading-progress"
                 style={{
                   background: 'linear-gradient(90deg, #10b981, #0ea5e9, #34d399, #10b981)',
                   backgroundSize: '300% 100%',
                   boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                   width: '100%',
                   height: '100%',
                 }}>
            </div>
            
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast"
                 style={{ transform: 'skewX(-20deg) translateX(-100%)' }}>
            </div>
          </div>
          
          {/* Progress markers - like barcode lines */}
          <div className="absolute -bottom-4 left-0 right-0 flex justify-between px-1">
            {[0, 25, 50, 75, 100].map((marker) => (
              <div key={marker} 
                   className="flex flex-col items-center">
                <div className="w-0.5 h-2 bg-emerald-200 rounded-full"></div>
                <span className="text-[8px] font-medium text-emerald-400 mt-0.5">{marker}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading message */}
        <p className="text-xs text-slate-400 mt-12 animate-pulse-slow">
          loading your smart pantry...
        </p>
      </div>
    </div>
  );
};

// Refined animation styles
const styles = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(2%, 2%) scale(1.05); }
    50% { transform: translate(-1%, 3%) scale(0.95); }
    75% { transform: translate(-2%, -1%) scale(1.02); }
  }
  .animate-float {
    animation: float 20s ease-in-out infinite;
  }

  @keyframes float-smooth {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
  }
  .animate-float-smooth {
    animation: float-smooth 6s ease-in-out infinite;
  }

  @keyframes bounce-soft {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  .animate-bounce-soft {
    animation: bounce-soft 3s ease-in-out infinite;
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }

  @keyframes spin-slower {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
  .animate-spin-slower {
    animation: spin-slower 12s linear infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.1); }
  }
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) rotate(0deg); opacity: 0; }
    50% { transform: translateX(100%) rotate(10deg); opacity: 0.3; }
    100% { transform: translateX(200%) rotate(20deg); opacity: 0; }
  }
  .animate-shimmer {
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer-fast {
    0% { transform: translateX(-100%) skewX(-20deg); }
    100% { transform: translateX(200%) skewX(-20deg); }
  }
  .animate-shimmer-fast {
    animation: shimmer-fast 2s ease-in-out infinite;
  }

  @keyframes loading-progress {
    0% { width: 0%; background-position: 0% 50%; }
    20% { width: 20%; background-position: 50% 50%; }
    40% { width: 40%; background-position: 100% 50%; }
    60% { width: 60%; background-position: 150% 50%; }
    80% { width: 80%; background-position: 200% 50%; }
    90% { width: 90%; background-position: 250% 50%; }
    95% { width: 95%; background-position: 275% 50%; }
    100% { width: 100%; background-position: 300% 50%; }
  }
  .animate-loading-progress {
    animation: loading-progress 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes cart-move {
    0% { transform: translateX(-15%); opacity: 0; }
    10% { transform: translateX(-5%); opacity: 1; }
    20% { transform: translateX(15%); }
    40% { transform: translateX(35%); }
    60% { transform: translateX(55%); }
    80% { transform: translateX(75%); }
    90% { transform: translateX(90%); opacity: 1; }
    100% { transform: translateX(115%); opacity: 0; }
  }
  .animate-cart-move {
    animation: cart-move 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes cart-wobble {
    0%, 100% { transform: translateX(-50%) rotate(0deg); }
    25% { transform: translateX(-50%) rotate(-4deg); }
    75% { transform: translateX(-50%) rotate(4deg); }
  }
  .animate-cart-wobble {
    animation: cart-wobble 0.4s ease-in-out infinite;
  }

  @keyframes fade-slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-slide-up {
    animation: fade-slide-up 0.8s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
  }

  @keyframes pulse-slow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }
  .animate-pulse-slow {
    animation: pulse-slow 2s ease-in-out infinite;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default LoadingScreen;