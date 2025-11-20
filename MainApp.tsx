import React, { useState, useCallback, useRef } from 'react';
import { AppStep, ModelOptions, UploadedImage, CommunityCreation } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UploadProduit from './components/UploadProduit';
import SelectModele from './components/SelectModele';
import Generation from './components/Generation';
import Resultats from './components/Resultats';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import Community from './components/Community';
import { generateImagesAndCaption } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import Toast, { playNotificationSound } from './components/Toast';
import Accueil from './components/Accueil';

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
    ambiance: 'Studio fond uni blanc',
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
  
  // State to track if we are in "Remix Mode" (community style applied)
  const [isRemixMode, setIsRemixMode] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  const auth = useAuth();

  // --- Navigation Handlers ---

  const handleNavigate = (newStep: AppStep) => {
    if (!auth?.currentUser && newStep !== AppStep.Accueil && newStep !== AppStep.Auth) {
        setStep(AppStep.Auth);
        return;
    }
    setStep(newStep);
  };

  const handleAuthSuccess = useCallback(() => {
      setStep(AppStep.Accueil); 
  }, []);

  const handleStartCreate = useCallback(() => {
    setUploadedImages([]);
    setGeneratedImages([]);
    setIsRemixMode(false); // Reset remix mode for new creation
    setStep(AppStep.Upload);
  }, []);

  const handleUploadConfirmed = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
    setStep(AppStep.Select);
    setError('');
  }, []);

  const saveToHistory = async (options: ModelOptions, imageUrls: string[]) => {
      if (!auth?.currentUser) return;
      try {
          await addDoc(collection(db, "users", auth.currentUser.uid, "history"), {
              style: options.style,
              ambiance: options.ambiance,
              timestamp: serverTimestamp(),
              imageCount: imageUrls.length
          });
      } catch (e) {
          console.error("Failed to save history stats:", e);
      }
  };

  const handleGenerate = useCallback(async () => {
    if (uploadedImages.length === 0) return;
    
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
        
      const { images, caption } = await generateImagesAndCaption(uploadedImages, modelOptions, "", setGenerationProgress, onImageGenerated, faceImage);
      
      if (isGenerationCancelled.current) return;
      if (images.length === 0) throw new Error("ALL_GENERATIONS_FAILED");

      setGeneratedImages(images);
      setMarketingCaption(caption);
      
      // Save stats & Add Gamification XP
      saveToHistory(modelOptions, images);
      if (auth?.addXp) {
        const xpEarned = 50 + (images.length * 10); 
        auth.addXp(xpEarned);
      }

      // Notification
      playNotificationSound();
      setToast({ message: "Génération terminée avec succès !", type: "success" });
      
      setTimeout(() => {
        if (!isGenerationCancelled.current) setStep(AppStep.Results);
      }, 1000);
    } catch (err: any) {
      if (isGenerationCancelled.current) return;
      console.error('Generation failed:', err);
      setError(err.message || 'Erreur inconnue');
      setToast({ message: "Erreur lors de la génération.", type: "error" });
      setStep(AppStep.Select);
    } finally {
      if (!isGenerationCancelled.current) setIsGenerating(false);
    }
  }, [uploadedImages, modelOptions, faceImage, auth?.currentUser]);

  // Handle Remix from Community
  const handleRemix = (creation: CommunityCreation) => {
    setIsRemixMode(true);
    setModelOptions(prev => ({
        ...prev,
        style: creation.style,
        ambiance: creation.ambiance,
        morphologie: creation.morphologie,
    }));
    setStep(AppStep.Upload);
    setToast({ message: "Style 'AfroVibe' appliqué ! Importez votre produit.", type: "info" });
  };

  // Handle Publish to Community
  const handlePublishToCommunity = async () => {
    if (!auth?.currentUser) return;

    try {
      // Generate a random gradient based on style (Quota friendly - no image storage)
      const colors = ['#7F00FF', '#00F0FF', '#FFD700', '#FF0080', '#00E676'];
      const c1 = colors[Math.floor(Math.random() * colors.length)];
      const c2 = colors[Math.floor(Math.random() * colors.length)];
      const gradient = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;

      const displayName = auth.userProfile?.displayName || auth.currentUser.email?.split('@')[0] || "Créateur";

      await addDoc(collection(db, "community_creations"), {
        style: modelOptions.style,
        ambiance: modelOptions.ambiance,
        morphologie: modelOptions.morphologie,
        likes: 0,
        author: displayName,
        authorUid: auth.currentUser.uid,
        gradient: gradient,
        timestamp: serverTimestamp()
      });

      setToast({ message: "Votre style a été partagé avec la communauté !", type: "success" });
      // Add Bonus XP for sharing
      if (auth.addXp) auth.addXp(100);

    } catch (e) {
      console.error("Error publishing to community:", e);
      setToast({ message: "Erreur lors de la publication.", type: "error" });
    }
  };

  // --- Render Content ---

  const renderStep = () => {
    if (!auth?.currentUser) {
        if (step === AppStep.Auth) return <Auth onAuthSuccess={handleAuthSuccess} />;
        return <Accueil onStart={() => setStep(AppStep.Auth)} />;
    }

    switch (step) {
      case AppStep.Accueil:
        return <Dashboard onStartNew={handleStartCreate} />;
      case AppStep.Auth:
        return <Dashboard onStartNew={handleStartCreate} />;
      case AppStep.Profile:
        return <UserProfile />;
      case AppStep.Admin:
        return <AdminDashboard />;
      case AppStep.Community:
        return <Community onRemix={handleRemix} />;
      case AppStep.Upload:
        return <UploadProduit onUploadConfirmed={handleUploadConfirmed} />;
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
            onRetry={() => handleGenerate()}
            isRemixMode={isRemixMode}
            onCancelRemix={() => setIsRemixMode(false)}
          />
        );
      case AppStep.Generate:
        return <Generation progress={generationProgress} generatedImages={partiallyGeneratedImages} />;
      case AppStep.Results:
        return (
          <Resultats
            images={generatedImages}
            caption={marketingCaption}
            onStartNew={handleStartCreate}
            modelOptions={modelOptions}
            onPublish={handlePublishToCommunity}
          />
        );
      default:
        return <Dashboard onStartNew={handleStartCreate} />;
    }
  };

  return (
    <Layout 
        currentStep={step} 
        onNavigate={handleNavigate} 
        isGenerating={isGenerating}
        onReturnToGeneration={() => setStep(AppStep.Generate)}
    >
        {toast && (
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast(null)} 
            />
        )}
        {renderStep()}
    </Layout>
  );
}