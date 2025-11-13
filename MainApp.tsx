import React, { useState, useCallback, useRef } from 'react';
import { AppStep, ModelOptions, UploadedImage } from './types';
import Accueil from './components/Accueil';
import UploadProduit from './components/UploadProduit';
import ValidateDescription from './components/ValidateDescription';
import SelectModele from './components/SelectModele';
import Generation from './components/Generation';
import Resultats from './components/Resultats';
import Header from './components/Header';
import { generateImagesAndCaption, detectProduct } from './services/geminiService';

export default function MainApp() {
  const [step, setStep] = useState<AppStep>(AppStep.Accueil);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [faceImage, setFaceImage] = useState<UploadedImage | null>(null);
  const [productDescription, setProductDescription] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
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
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const isGenerationCancelled = useRef(false);

  const handleStart = useCallback(() => {
    setStep(AppStep.Upload);
  }, []);

  const handleProductAnalysis = useCallback(async (images: UploadedImage[]) => {
    setUploadedImages(images);
    setStep(AppStep.ValidateDescription);
    setIsDetecting(true);
    setError('');
    try {
        const description = await detectProduct(images);
        setProductDescription(description);
    } catch (err) {
        console.error("Product detection failed:", err);
        let finalError = "La détection du produit a échoué. Veuillez décrire le produit manuellement.";
        if (err instanceof Error) {
            switch (err.message) {
                case 'SAFETY_BLOCK':
                    finalError = "L'image a été bloquée par nos filtres de sécurité. Essayez une autre photo.";
                    break;
                case 'API_KEY_INVALID':
                    finalError = "Votre clé API n'est pas valide. Veuillez la vérifier.";
                    break;
                case 'BILLING_NOT_ENABLED':
                    finalError = "La facturation n'est pas activée sur votre compte Google. Activez-la pour continuer.";
                    break;
                case 'QUOTA_EXCEEDED':
                case 'MODEL_OVERLOADED':
                    finalError = "Le service est surchargé en raison d'une forte demande. Veuillez réessayer dans quelques instants.";
                    break;
                case 'RETRY_FAILED':
                    finalError = "La connexion au service est instable. Vérifiez votre connexion internet et réessayez.";
                    break;
                default:
                    finalError = "Une erreur inattendue est survenue. Veuillez décrire le produit manuellement.";
                    break;
            }
        }
        setError(finalError);
        setProductDescription('');
    } finally {
        setIsDetecting(false);
    }
  }, []);
  
  const handleDescriptionValidated = useCallback((finalDescription: string) => {
      setProductDescription(finalDescription);
      setError('');
      setStep(AppStep.Select);
  }, []);

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
     if (!productDescription.trim()) {
        setError("La description du produit ne peut pas être vide.");
        setStep(AppStep.ValidateDescription);
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

  const handleReset = useCallback(() => {
    isGenerationCancelled.current = false;
    setStep(AppStep.Accueil);
    setUploadedImages([]);
    setGeneratedImages([]);
    setPartiallyGeneratedImages([]);
    setFaceImage(null);
    setProductDescription('');
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
        return <UploadProduit onAnalyseRequest={handleProductAnalysis} />;
      case AppStep.ValidateDescription:
        return <ValidateDescription 
                  productImages={uploadedImages}
                  initialDescription={productDescription}
                  isDetecting={isDetecting}
                  onConfirm={handleDescriptionValidated}
                  error={error}
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
          />
        );
      case AppStep.Generate:
        return <Generation progress={generationProgress} generatedImages={partiallyGeneratedImages} />;
      case AppStep.Results:
        return (
          <Resultats
            images={generatedImages}
            caption={marketingCaption}
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
            onGoHome={handleReset} 
        />
        <main>{renderStep()}</main>
      </div>
    </div>
  );
}