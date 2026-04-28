import React from 'react';

const LoadingScreen = ({ message = 'Optimizing Experience' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdff] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-lg shadow-indigo-100" />
        <p className="mt-6 text-slate-400 font-medium tracking-widest text-[10px] uppercase animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
