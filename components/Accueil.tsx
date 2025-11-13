import React from 'react';

interface AccueilProps {
  onStart: () => void;
}

const Accueil: React.FC<AccueilProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 flex justify-center items-center flex-wrap gap-x-3 sm:gap-x-4">
        <span className="text-[#F77F00]">AfroVibe</span>
        <span className="text-white">Aura</span>
        <span className="text-[#009E60]">Studio</span>
      </h1>
      <p className="max-w-2xl text-md sm:text-lg md:text-xl text-gray-300 mb-8">
        Donnez vie à vos produits avec des mannequins virtuels afro-futuristes.
        Notre IA crée des visuels uniques qui captivent votre audience.
      </p>
      <button
        onClick={onStart}
        className="bg-primary text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:bg-accent transition-all duration-300 transform hover:scale-105 hover:shadow-glow-accent"
      >
        Commencer maintenant
      </button>
      <div className="mt-8 space-y-4 w-full max-w-sm flex flex-col items-center">
        <img
            src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Personne d'origine africaine interagissant avec une interface d'intelligence artificielle futuriste"
            className="rounded-2xl shadow-lg border-2 border-accent/30 object-cover w-full"
        />
      </div>
      <footer className="mt-12 text-accent font-medium text-sm">
        <p>powered by DAML Consulting</p>
      </footer>
    </div>
  );
};

export default Accueil;