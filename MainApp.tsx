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
  const [modelOptions, setModelOptions] = useState<ModelOptions>({
    sexe: 'Femme',
    typeDePeau: 'ébène',
    morphologie: 'mince',
    age: 'jeune adulte',
    style: 'élégant',
    expression: 'sourire léger',
    origineEthnique: 'Afrique de l’Ouest',
    realismeMaximal: true,
    outputFormat: '1:1',
    customWidth: 1024,
    customHeight: 1024,
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
      setError('Veuillez d\'abord télécharger au moins une image de produit.');
      return;
    }
    setGenerationProgress(0);
    setStep(AppStep.Generate);
    setError('');
    setIsGenerating(true);
    try {
      const { images, caption } = await generateImagesAndCaption(uploadedImages, modelOptions, setGenerationProgress);
      setGeneratedImages(images);
      setMarketingCaption(caption);
      setStep(AppStep.Results);
    } catch (err) {
      console.error('Generation failed:', err);
      let detailedMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      if (err instanceof Error) {
          // Extract a more user-friendly message
          if (err.message.includes('403') || err.message.includes('permission')) {
               detailedMessage = "Permission refusée. Il est possible que votre clé API n'ait pas accès au modèle de génération d'images ('gemini-2.5-flash-image'). Assurez-vous que l'API est bien activée sur votre projet Google Cloud.";
          } else if (err.message.includes('400') || err.message.includes('Invalid')) {
               detailedMessage = `La requête est invalide : ${err.message}. Cela peut être dû à un problème avec l'image téléversée. Essayez une autre image.`;
          } else if (err.message.includes('API key not valid')) {
              detailedMessage = "Votre clé API n'est plus valide. Veuillez en générer une nouvelle.";
          } else if (err.message.includes('Safety')) {
              detailedMessage = "La génération a été bloquée pour des raisons de sécurité. Veuillez essayer avec une autre image ou modifier les options du modèle.";
          } else if (err.message.includes('404') || err.message.toLowerCase().includes('not_found')) {
            detailedMessage = "Le modèle d'IA est introuvable (404 Not Found). Causes possibles : 1) L'API n'est pas encore totalement activée sur votre projet Google (cela peut prendre quelques minutes après la création de la clé). 2) Le modèle n'est pas disponible dans votre région. Veuillez réessayer dans quelques instants.";
          } else {
               detailedMessage = err.message; // Default to the actual error message
          }
      }
      setError(`La génération a échoué : ${detailedMessage}`);
      setStep(AppStep.Select); // Go back to selection on error
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImages, modelOptions]);

  const handleReset = useCallback(() => {
    setStep(AppStep.Accueil);
    setUploadedImages([]);
    setGeneratedImages([]);
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
      <div className="container mx-auto px-4 py-8">
        <main>{renderStep()}</main>
      </div>
    </div>
  );
}