import React from 'react';
import InstallPWAButton from './InstallPWAButton';

interface AccueilProps {
  onStart: () => void;
}

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="inline-block mx-1 -mt-1" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
    </svg>
);

const Accueil: React.FC<AccueilProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
        Modèle Produit Réaliste
      </h1>
      <p className="max-w-2xl text-md sm:text-lg md:text-xl text-gray-300 mb-8">
        Générez des photoshoots ultra-réalistes de vos produits portés par des modèles virtuels.
        La solution professionnelle pour les marques et vendeurs africains.
      </p>
      <button
        onClick={onStart}
        className="bg-primary text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:bg-accent transition-all duration-300 transform hover:scale-105 hover:shadow-glow-accent"
      >
        Commencer maintenant
      </button>
      <div className="mt-8 space-y-4">
        <InstallPWAButton />
        <div className="text-center text-gray-400 text-sm max-w-md mx-auto p-4 bg-dark-card/30 rounded-lg">
            <p>
                Pour une expérience optimale, installez cette application sur votre appareil.
            </p>
            <p className="mt-2">
                <strong className="text-accent">Sur Android :</strong> Utilisez le bouton ci-dessus ou cherchez "Installer l'application" dans le menu de votre navigateur.
            </p>
            <p className="mt-1">
                <strong className="text-accent">Sur iOS (iPhone/iPad) :</strong> Appuyez sur l'icône de Partage <ShareIcon/> dans Safari, puis faites défiler et sélectionnez "Sur l'écran d'accueil".
            </p>
        </div>
      </div>
    </div>
  );
};

export default Accueil;