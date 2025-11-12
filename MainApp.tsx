import React, { useState, useCallback } from 'react';
import { AppStep, ModelOptions, UploadedImage } from './types';
import Accueil from './components/Accueil';
import UploadProduit from './components/UploadProduit';
import SelectModele from './components/SelectModele';
import Generation from './components/Generation';
import Resultats from './components/Resultats';
import { generateImagesAndCaption } from './services/geminiService';

export default function MainApp() {
  const [step, setStep] = useState<AppStep>(AppStep.Accueil);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [faceImage, setFaceImage] = useState<UploadedImage | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelOptions>({
    sexe: 'Femme',
    typeDePeau: 'noir',
    morphologie: 'standard',
    age: '20-25 ans',
    style: 'chic',
    expression: 'sourire léger',
    origineEthnique: 'Afrique de l’Ouest',
    arrierePlan: 'Studio sobre (gris/noir)',
    useMyFace: false,
  });
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [marketingCaption, setMarketingCaption] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleStart = useCallback(() => {
    setStep(AppStep.Upload);
  }, []);

  const handleImagesUpload = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
    setStep(AppStep.Select);
  }, []);
  
  const handleBackToSelect = useCallback(() => {
    setStep(AppStep.Select);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (uploadedImages.length === 0) {
      setError('Oups ! Vous devez d’abord sélectionner ou prendre une photo de votre produit.');
      return;
    }
    if (modelOptions.useMyFace && !faceImage) {
        setError("Veuillez téléverser une photo de votre visage pour utiliser cette option.");
        return;
    }
    setGenerationProgress(0);
    setStep(AppStep.Generate);
    setError('');
    setIsGenerating(true);
    try {
      const { images, caption } = await generateImagesAndCaption(uploadedImages, modelOptions, setGenerationProgress, faceImage);
      setGeneratedImages(images);
      setMarketingCaption(caption);
      // Attendre un instant pour que l'utilisateur voie le message de fin
      setTimeout(() => {
        setStep(AppStep.Results);
      }, 1500);
    } catch (err) {
      console.error('Generation failed:', err);
      let finalError = 'Une erreur imprévue est survenue. Pas d’inquiétude, recommencez simplement.';
      if (err instanceof Error) {
          const errorMessage = (err.message || '').toLowerCase();
          if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
               finalError = "Le serveur est très demandé. Veuillez réessayer dans un instant.";
          } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || !navigator.onLine) {
               finalError = "Vérifiez votre connexion internet et relancez la génération.";
          } else {
               finalError = "Une erreur est survenue pendant la création du modèle. Veuillez réessayer dans un instant.";
          }
      }
      setError(finalError);
      setStep(AppStep.Select); // Revenir à la sélection en cas d'erreur
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImages, modelOptions, faceImage]);

  const handleReset = useCallback(() => {
    setStep(AppStep.Accueil);
    setUploadedImages([]);
    setGeneratedImages([]);
    setFaceImage(null);
    setModelOptions(prev => ({ ...prev, useMyFace: false }));
    setMarketingCaption('');
    setError('');
    setGenerationProgress(0);
  }, []);
  
  const renderStep = () => {
    switch (step) {
      case AppStep.Accueil:
        return <Accueil onStart={handleStart} />;
      case AppStep.Upload:
        return <UploadProduit onImagesUpload={handleImagesUpload} />;
      case AppStep.Select:
        return (
          <SelectModele
            modelOptions={modelOptions}
            setModelOptions={setModelOptions}
            onGenerate={handleGenerate}
            productImagePreviews={uploadedImages.map(img => img.previewUrl)}
            error={error}
            isGenerating={isGenerating}
            faceImage={faceImage}
            setFaceImage={setFaceImage}
          />
        );
      case AppStep.Generate:
        return <Generation progress={generationProgress} />;
      case AppStep.Results:
        return (
          <Resultats
            images={generatedImages}
            caption={marketingCaption}
            onRestart={handleReset}
            onBack={handleBackToSelect}
          />
        );
      default:
        return <Accueil onStart={handleStart} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-dark-bg-start to-dark-bg-end font-sans text-gray-200 antialiased">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <main>{renderStep()}</main>
      </div>
    </div>
  );
}