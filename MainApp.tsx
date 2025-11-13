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
        setError("La détection du produit a échoué. Veuillez décrire le produit manuellement.");
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
      setError('Oups ! Vous devez d’abord sélectionner ou prendre une photo de votre produit.');
      return;
    }
    if (modelOptions.useMyFace && !faceImage) {
        setError("Veuillez téléverser une photo de votre visage pour utiliser cette option.");
        return;
    }
     if (!productDescription.trim()) {
        setError("La description du produit ne peut pas être vide.");
        // This should not happen if flow is correct, but as a safeguard
        setStep(AppStep.ValidateDescription);
        return;
    }
    isGenerationCancelled.current = false;
    setGenerationProgress(0);
    setPartiallyGeneratedImages(Array(5).fill(null)); // 5 images now
    setStep(AppStep.Generate);
    setError('');
    setIsGenerating(true);
    try {
      const onImageGenerated = (image: string, index: number) => {
        setPartiallyGeneratedImages(prev => {
            const newImages = [...prev];
            newImages[index] = image;
            return newImages;
        });
      };
        
      const { images, caption } = await generateImagesAndCaption(uploadedImages, modelOptions, productDescription, setGenerationProgress, onImageGenerated, faceImage);
      
      if (isGenerationCancelled.current) { return; }

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
      let finalError = 'Une erreur imprévue est survenue. Pas d’inquiétude, recommencez simplement.';
      if (err instanceof Error) {
          const errorMessage = (err.message || '').toLowerCase();
          if (errorMessage.includes('sécurité')) {
               if (modelOptions.useMyFace) {
                   finalError = "La génération avec votre visage a été bloquée par les filtres de sécurité. Essayez avec une autre photo de visage, mieux éclairée et avec une expression neutre.";
               } else {
                   finalError = "La génération d'image a été bloquée. Essayez de changer les options de style, d'ambiance ou la description du produit.";
               }
          } else if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
               finalError = "Le serveur est très demandé. Veuillez réessayer dans un instant.";
          } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || !navigator.onLine) {
               finalError = "Vérifiez votre connexion internet et relancez la génération.";
          } else {
               finalError = "Une erreur est survenue pendant la création du modèle. Veuillez réessayer plus tard.";
          }
      }
      setError(finalError);
      setStep(AppStep.Select);
    } finally {
      setIsGenerating(false);
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