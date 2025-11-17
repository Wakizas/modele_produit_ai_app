import React from 'react';

const LoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-dark-bg-start to-dark-bg-end text-white">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
    <p className="mt-4 text-lg text-gray-300">Vérification en cours...</p>
  </div>
);

export default LoadingScreen;
