
import React, { useState, useCallback, useRef } from 'react';
import { UploadedImage } from '../types';

interface UploadProduitProps {
  onImagesUpload: (images: UploadedImage[]) => void;
}

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const UploadProduit: React.FC<UploadProduitProps> = ({ onImagesUpload }) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Safely create file array to prevent potential null issues.
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    const newImages: UploadedImage[] = [];
    const remainingSlots = 3 - uploadedImages.length;
    
    const filesToProcess = files.slice(0, remainingSlots);

    let processedCount = 0;
    // FIX: Explicitly type `file` to resolve type inference errors.
    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        newImages.push({
          file: file,
          base64: base64Data,
          previewUrl: URL.createObjectURL(file),
        });
        processedCount++;
        if(processedCount === filesToProcess.length) {
            setUploadedImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
     // Clear the input value to allow re-uploading the same file
     if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, [uploadedImages]);

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }
  
  const handleClick = () => {
      fileInputRef.current?.click();
  }

  const handleNext = () => {
    if (uploadedImages.length > 0) {
        onImagesUpload(uploadedImages);
    }
  }

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2">Étape 1 : Téléversez votre/vos produit(s)</h2>
      <p className="text-gray-400 mb-6 text-center">
        Importez jusqu'à 3 images de produits pour créer une scène.
      </p>
      
      <div className="w-full p-8 border-2 border-dashed border-accent rounded-xl text-center bg-dark-card/50 shadow-lg mb-6">
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp, image/heic, image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          multiple
          disabled={uploadedImages.length >= 3}
        />
        <button
          onClick={handleClick}
          disabled={uploadedImages.length >= 3}
          className="bg-primary text-white font-bold py-3 px-6 rounded-xl inline-flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-accent hover:shadow-glow-accent disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
        >
            <UploadIcon />
          Téléverser (Max {3 - uploadedImages.length})
        </button>
         <p className="mt-4 text-sm text-gray-500">Formats acceptés : PNG, JPG, WEBP, HEIC, SVG</p>
      </div>

      {uploadedImages.length > 0 && (
          <div className="w-full">
            <h3 className="text-xl font-semibold text-accent mb-4">Produits téléversés :</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative aspect-square bg-dark-card rounded-lg overflow-hidden shadow-md">
                  <img src={image.previewUrl} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors">
                    <CloseIcon/>
                  </button>
                </div>
              ))}
            </div>
             <button
                onClick={handleNext}
                className="w-full bg-secondary text-black font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105"
            >
                Étape suivante
            </button>
          </div>
        )}
    </div>
  );
};

export default UploadProduit;
