import React, { useState, useEffect } from 'react';
import { UploadedImage } from '../types';

interface ValidateDescriptionProps {
  productImages: UploadedImage[];
  initialDescription: string;
  isDetecting: boolean;
  onConfirm: (description: string) => void;
  error: string;
}

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
);

const ValidateDescription: React.FC<ValidateDescriptionProps> = ({ 
    productImages, 
    initialDescription, 
    isDetecting, 
    onConfirm,
    error 
}) => {
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription]);
  
  const handleConfirm = () => {
      if (description.trim()) {
          onConfirm(description);
      }
  }

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2">Étape 2 : Validation du produit</h2>
      <p className="text-gray-400 mb-6 text-center">
        Notre IA a identifié votre produit. Validez ou modifiez la description pour que nos modèles adoptent les meilleures poses.
      </p>
      
      <div className="w-full p-6 bg-dark-card/50 rounded-2xl shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {productImages.map((image, index) => (
            <div key={index} className="relative aspect-square bg-dark-card rounded-lg overflow-hidden shadow-md">
                <img src={image.previewUrl} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
            </div>
            ))}
        </div>

        {isDetecting ? (
            <div className="flex flex-col items-center justify-center h-24">
                <LoadingSpinner />
                <p className="mt-4 text-gray-400">Analyse de l'image en cours...</p>
            </div>
        ) : (
            <>
                <label htmlFor="description" className="block text-lg font-semibold text-accent mb-2">Description du produit :</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white focus:border-accent focus:ring-accent transition"
                    rows={3}
                    placeholder="Ex: T-shirt noir en coton avec un motif..."
                />
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                
                <button
                    onClick={handleConfirm}
                    disabled={!description.trim()}
                    className="w-full mt-6 bg-secondary text-black font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Valider et continuer
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default ValidateDescription;