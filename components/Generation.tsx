import React, { useState, useEffect } from 'react';

interface GenerationProps {
  progress: number;
}

const Generation: React.FC<GenerationProps> = ({ progress }) => {
  const [message, setMessage] = useState("Préparation du modèle…");

  useEffect(() => {
    if (progress < 25) {
      setMessage("Préparation du modèle…");
    } else if (progress < 50) {
      setMessage("Mise en place du produit…");
    } else if (progress < 75) {
      setMessage("Ajustement des lumières et des ombres…");
    } else {
      setMessage("Finalisation de l’image réaliste…");
    }
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Création du modèle en cours…</h2>
      <p className="text-xl text-gray-300 mb-8">
        Veuillez patienter, votre avatar porte votre produit avec style
      </p>
      <div className="w-full max-w-md bg-gray-700 rounded-full h-6 overflow-hidden border-2 border-accent/30 relative">
        <div 
          className="bg-gradient-to-r from-accent to-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-md font-bold text-white">
            {Math.round(progress)}%
        </span>
      </div>
       <div className="mt-4 text-gray-400 h-6">
            {message}
       </div>
    </div>
  );
};

export default Generation;