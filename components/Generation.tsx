import React, { useState, useEffect } from 'react';

interface GenerationProps {
  progress: number;
}

const Generation: React.FC<GenerationProps> = ({ progress }) => {
  const [message, setMessage] = useState("Préparation du studio virtuel…");

  useEffect(() => {
    if (progress < 25) {
      setMessage("Pose 1 : Création du modèle…");
    } else if (progress < 50) {
      setMessage("Pose 2 : Intégration du produit…");
    } else if (progress < 75) {
      setMessage("Pose 3 : Ajustement de l'éclairage…");
    } else if (progress < 100) {
      setMessage("Pose 4 : Finalisation et rendu ultra-réaliste…");
    } else {
      setMessage("Génération terminée ! Préparation de vos visuels…");
    }
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Création en cours…</h2>
      <p className="text-xl text-gray-300 mb-8">
        Votre modèle virtuel prend la pose avec votre produit.
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