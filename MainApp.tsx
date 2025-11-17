import React, { useState, useCallback, useRef } from 'react';
import { AppStep, ModelOptions, UploadedImage } from './types';
import Accueil from './components/Accueil';
import UploadProduit from './components/UploadProduit';
import ValidateDescription from './components/ValidateDescription';
import SelectModele from './components/SelectModele';
import Generation from './components/Generation';
import Resultats from './components/Resultats';
import Header from './components/Header';
import { generateImagesAndCaption, detectProductDescription } from './services/geminiService';

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
    ambiance: 'Studio sobre (éclairage neutre)',
    tonMarketing: 'Professionnel',
    useMyFace: false,
  });
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [partiallyGeneratedImages, setPartiallyGeneratedImages] = useState<(string | null)[]>([]);
  const [marketingCaption, setMarketingCaption] = useState<string>('');
  const [productDescription, setProductDescription] = useState('');
  const [isDetectingDescription, setIsDetectingDescription] = useState(false);
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const isGenerationCancelled = useRef(false);

  const handleStart = useCallback(() => {
    setStep(AppStep.Upload);
  }, []);

  const handleUploadConfirmed = useCallback(async (images: UploadedImage[]) => {
    setUploadedImages(images);
    setStep(AppStep.ValidateDescription);
    setError('');
    setIsDetectingDescription(true);
    setProductDescription('');

    try {
      const description = await detectProductDescription(images[0]);
      setProductDescription(description);
    } catch (err) {
      console.error('Description detection failed:', err);
      let detectionError = "L'IA n'a pas pu identifier le produit. Veuillez entrer manuellement une description.";
      if (err instanceof Error) {
          if (err.message.includes('OVERLOADED')) {
              detectionError = "Le service est surchargé. Veuillez réessayer ou entrer une description manuellement.";
          } else if (err.message.includes('SAFETY')) {
              detectionError = "L'image n'a pas pu être analysée. Veuillez réessayer avec une autre image ou entrer une description manuellement.";
          }
      }
      setError(detectionError);
      setProductDescription(''); 
    } finally {
      setIsDetectingDescription(false);
    }
  }, []);

  const handleDescriptionConfirmed = useCallback((description: string) => {
    setProductDescription(description);
    setStep(AppStep.Select);
    setError('');
  }, []);

  const handleRetryDescriptionDetection = useCallback(async () => {
    if (uploadedImages.length === 0) return;
    setError('');
    setIsDetectingDescription(true);
    setProductDescription('');
    try {
      const description = await detectProductDescription(uploadedImages[0]);
      setProductDescription(description);
    } catch (err) {
      console.error('Description detection failed on retry:', err);
      let detectionError = "La nouvelle tentative a échoué. Veuillez entrer manuellement une description.";
       if (err instanceof Error && err.message.includes('OVERLOADED')) {
          detectionError = "Le service est toujours surchargé. Veuillez entrer manuellement une description.";
       }
      setError(detectionError);
      setProductDescription('');
    } finally {
      setIsDetectingDescription(false);
    }
  }, [uploadedImages]);

  const handleGoBack = useCallback(() => {
    switch (step) {
      case AppStep.Upload:
        setStep(AppStep.Accueil);
        break;
      case AppStep.ValidateDescription:
        setStep(AppStep.Upload);
        setError('');
        break;
      case AppStep.Select:
        isGenerationCancelled.current = true;
        setStep(AppStep.ValidateDescription);
        if (error) setError('');
        break;
      case AppStep.Results:
        setStep(AppStep.Select);
        break;
    }
  }, [step, error]);

  const handleCancelGeneration = useCallback(() => {
    isGenerationCancelled.current = true;
    setStep(AppStep.Select);
    setIsGenerating(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (uploadedImages.length === 0) {
      setError('Vous devez d’abord téléverser une photo de votre produit.');
      return;
    }
    if (modelOptions.useMyFace && !faceImage) {
        setError("Veuillez téléverser une photo de votre visage pour utiliser cette option.");
        return;
    }
    isGenerationCancelled.current = false;
    setGenerationProgress(0);
    setPartiallyGeneratedImages(Array(5).fill(null));
    setStep(AppStep.Generate);
    setError('');
    setIsGenerating(true);
    try {
      const onImageGenerated = (image: string, index: number) => {
        if (isGenerationCancelled.current) return;
        setPartiallyGeneratedImages(prev => {
            const newImages = [...prev];
            newImages[index] = image;
            return newImages;
        });
      };
        
      const { images, caption } = await generateImagesAndCaption(uploadedImages, modelOptions, productDescription, setGenerationProgress, onImageGenerated, faceImage);
      
      if (isGenerationCancelled.current) { return; }

      // Handle the case where all image generations failed but the promise didn't reject (e.g., Promise.allSettled)
      if (images.length === 0) {
          throw new Error("ALL_GENERATIONS_FAILED");
      }

      setGeneratedImages(images);
      setMarketingCaption(caption);
      
      setTimeout(() => {
        if (!isGenerationCancelled.current) {
            setStep(AppStep.Results);
        }
      }, 1500);
    } catch (err) {
      if (isGenerationCancelled.current) { return; }
      console.error('Generation failed:', err);
      let finalError = 'Une erreur imprévue est survenue lors de la génération.';
      if (err instanceof Error) {
          switch (err.message) {
              case 'SAFETY_BLOCK_GENERATION':
                  finalError = "La génération a été bloquée. Essayez de modifier les options (style, ambiance) ou la description du produit.";
                  break;
              case 'API_KEY_INVALID':
                  finalError = "Votre clé API n'est pas valide. Veuillez vérifier votre configuration.";
                  break;
              case 'BILLING_NOT_ENABLED':
                  finalError = "La facturation n'est pas activée sur votre compte Google. Activez-la pour pouvoir générer des images.";
                  break;
              case 'QUOTA_EXCEEDED':
              case 'MODEL_OVERLOADED':
                  finalError = "Le service est actuellement surchargé par une forte demande. Veuillez réessayer dans quelques instants.";
                  break;
              case 'RETRY_FAILED_GENERATION':
              case 'ALL_GENERATIONS_FAILED':
                  finalError = "Toutes les tentatives de génération d'images ont échoué. Le service rencontre peut-être des difficultés. Veuillez réessayer.";
                  break;
              default:
                  finalError = 'Une erreur inattendue est survenue. Veuillez réessayer.';
                  break;
          }
      }
      setError(finalError);
      setStep(AppStep.Select);
    } finally {
      if (!isGenerationCancelled.current) {
          setIsGenerating(false);
      }
    }
  }, [uploadedImages, modelOptions, faceImage, productDescription]);
  
  const retryGeneration = useCallback(() => {
      setError('');
      handleGenerate();
  }, [handleGenerate]);

  const resetState = () => {
    isGenerationCancelled.current = false;
    setUploadedImages([]);
    setGeneratedImages([]);
    setPartiallyGeneratedImages([]);
    setFaceImage(null);
    setProductDescription('');
    setModelOptions(prev => ({ ...prev, useMyFace: false }));
    setMarketingCaption('');
    setError('');
    setGenerationProgress(0);
  };

  const handleResetToHome = useCallback(() => {
    resetState();
    setStep(AppStep.Accueil);
  }, []);

  const handleStartNew = useCallback(() => {
    resetState();
    setStep(AppStep.Upload);
  }, []);
  
  const renderStep = () => {
    switch (step) {
      case AppStep.Accueil:
        return <Accueil onStart={handleStart} />;
      case AppStep.Upload:
        return <UploadProduit onUploadConfirmed={handleUploadConfirmed} />;
      case AppStep.ValidateDescription:
        return <ValidateDescription
            productImages={uploadedImages}
            initialDescription={productDescription}
            isDetecting={isDetectingDescription}
            onConfirm={handleDescriptionConfirmed}
            error={error}
            onRetry={handleRetryDescriptionDetection}
            />;
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
            onRetry={retryGeneration}
          />
        );
      case AppStep.Generate:
        return <Generation progress={generationProgress} generatedImages={partiallyGeneratedImages} />;
      case AppStep.Results:
        return (
          <Resultats
            images={generatedImages}
            caption={marketingCaption}
            onStartNew={handleStartNew}
          />
        );
      default:
        return <Accueil onStart={handleStart} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-dark-bg-start to-dark-bg-end font-sans text-gray-200 antialiased">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Header 
            step={step} 
            onGoBack={step === AppStep.Generate ? handleCancelGeneration : handleGoBack} 
            onGoHome={handleResetToHome} 
        />
        <main>{renderStep()}</main>
      </div>
    </div>
  );
}