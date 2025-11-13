import React, { useState, useEffect } from 'react';

interface GenerationProps {
  progress: number;
  generatedImages: (string | null)[];
}

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
);

const Generation: React.FC<GenerationProps> = ({ progress, generatedImages }) => {
  const [message, setMessage] = useState("Préparation du studio virtuel…");
  const totalPoses = 5;

  useEffect(() => {
    const completedCount = generatedImages.filter(img => img).length;
    if (progress < 100) {
        if (completedCount < totalPoses) {
            setMessage(`Génération de la pose ${completedCount + 1}/${totalPoses}...`);
        } else {
            setMessage("Création de la légende marketing...");
        }
    } else {
      setMessage("Génération terminée ! Préparation de vos visuels…");
    }
  }, [progress, generatedImages]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Création en cours…</h2>
      <p className="text-xl text-gray-300 mb-8 max-w-lg">
        Votre modèle virtuel prend la pose avec votre produit. Les images apparaîtront ci-dessous dès qu'elles seront prêtes.
      </p>

      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 max-w-5xl">
        {Array.from({ length: totalPoses }).map((_, index) => (
          <div key={index} className="bg-dark-card rounded-xl shadow-lg overflow-hidden group aspect-[3/4] flex items-center justify-center">
            {generatedImages[index] ? (
              <img src={generatedImages[index] as string} alt={`Visuel généré ${index + 1}`} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <LoadingSpinner />
                <span className="mt-2 text-sm">Pose {index + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>

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