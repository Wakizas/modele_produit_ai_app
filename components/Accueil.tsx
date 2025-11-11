import React from 'react';

interface AccueilProps {
  onStart: () => void;
}

const Accueil: React.FC<AccueilProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
        Modèle Produit Réaliste 👗
      </h1>
      <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-8">
        Générez des photoshoots ultra-réalistes de vos produits portés par des modèles virtuels.
        La solution professionnelle pour les marques et vendeurs africains.
      </p>
      <button
        onClick={onStart}
        className="bg-primary text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:bg-accent transition-all duration-300 transform hover:scale-105 hover:shadow-glow-accent"
      >
        Commencer maintenant
      </button>
    </div>
  );
};

export default Accueil;