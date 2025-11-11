import { GoogleGenAI, Modality } from '@google/genai';
import { ModelOptions, UploadedImage } from '../types';

// FIX: Define `process` for browser environments to allow access to environment variables.
// This avoids TypeScript errors for `process.env` and removes the need for vite/client types.
declare const process: {
  env: {
    API_KEY?: string;
  };
};

// Lazily initialize the AI instance to avoid errors when API_KEY is not yet available.
let ai: GoogleGenAI | undefined;

function getAiInstance(): GoogleGenAI {
    if (!ai) {
        if (!process.env.API_KEY) {
            // This state should not be reachable if the App component correctly guards access.
            throw new Error("API key is not available for Gemini AI initialization.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

// FIX: Add and export validateApiKey function to resolve import error in ApiValidator.tsx.
export async function validateApiKey(): Promise<{ valid: boolean; error: string }> {
  try {
    // A lightweight call to check if the API key is valid.
    await getAiInstance().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hello'
    });
    return { valid: true, error: '' };
  } catch (e) {
    console.error('API key validation failed:', e);
    ai = undefined; // Reset on failure
    if (e instanceof Error) {
        return { valid: false, error: e.message };
    }
    return { valid: false, error: 'Une erreur inconnue est survenue lors de la validation.' };
  }
}

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

const generateImagePrompt = (options: ModelOptions, pose: string): string => {
  const realismePrompt = options.realismeMaximal 
    ? "QUALITÉ MAXIMALE ACTIVÉE : Le rendu doit être ultra-réaliste, indiscernable d'une vraie photographie de mode professionnelle. Fais attention aux détails de la peau, des cheveux, des tissus et de la lumière."
    : "QUALITÉ STANDARD : Produis une image de haute qualité, claire et professionnelle.";

  let formatInstruction = '';
  if (options.outputFormat === 'Personnalisé') {
      formatInstruction = `L'image doit avoir une résolution personnalisée de ${options.customWidth}x${options.customHeight} pixels. La composition doit être adaptée à ce format.`;
  } else {
      formatInstruction = `L'image doit avoir un format (aspect ratio) de ${options.outputFormat}. La composition doit être adaptée à ce ratio.`;
  }

  return `CRÉATION D'UN VISUEL PRODUIT PROFESSIONNEL ULTRA-RÉALISTE.
CONTEXTE : Une ou plusieurs images de produits sont fournies. Tu dois les mettre en scène sur un modèle photoréaliste.
MISSION : Intègre le(s) produit(s) des images fournies sur un modèle virtuel. Si plusieurs produits sont fournis (ex: chemise, pantalon, montre), habille le modèle avec tous les articles de manière cohérente et naturelle.

RÈGLES STRICTES DU MODÈLE (NON-NÉGOCIABLES) : Le modèle doit EXACTEMENT correspondre aux critères suivants :
- Sexe : ${options.sexe}
- Type de peau : ${options.typeDePeau}
- Origine ethnique : ${options.origineEthnique}. Les traits du visage doivent être authentiques et représentatifs de cette origine.
- Morphologie : ${options.morphologie}
- Âge apparent : ${options.age}
- Expression faciale : ${options.expression}.

INSTRUCTIONS DE STYLE ET DE POSE :
- Format de Sortie : ${formatInstruction}
- Style général : ${options.style}.
- Pose du modèle : ${pose}. La pose doit être naturelle et mettre en valeur le(s) produit(s).
- ADAPTATION DE LA POSE : La pose doit s'adapter aux produits. Si une montre est présente, le poignet doit être visible. Si des chaussures sont fournies, les pieds doivent être dans le cadre. Pour une tenue complète, une pose en pied est nécessaire.
- Éclairage : Professionnel, type studio photo, pour un rendu luxueux.
- Arrière-plan : Simple, sombre et flou pour que le produit et le modèle soient le centre de l'attention.
- ${realismePrompt}

OBJECTIF FINAL : Produire une image de qualité photographique, commercialement attractive, qui respecte impérativement toutes les règles ci-dessus. Le(s) produit(s) doi(ven)t être parfaitement intégré(s), sans déformation.`;
};


const POSES = [
  "Pose naturelle et élégante, regardant la caméra avec confiance.",
  "De trois-quarts, montrant le profil du produit principal.",
  "Marche lente et stylée vers la caméra, créant un effet de mouvement.",
  "Adossé à un mur texturé sombre, pose décontractée mais chic."
];

async function generateSingleImage(imageParts: any[], options: ModelOptions, pose: string): Promise<string> {
  const model = 'gemini-2.5-flash-image';
  const textPart = { text: generateImagePrompt(options, pose) };

  const response = await getAiInstance().models.generateContent({
    model,
    contents: { parts: [...imageParts, textPart] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  // FIX: Robustly find the image part instead of assuming it's the first one.
  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (imagePart && imagePart.inlineData) {
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  }
  throw new Error('Aucune image n\'a été générée.');
}

async function generateMarketingCaption(imageParts: any[], options: ModelOptions): Promise<string> {
  const model = 'gemini-2.5-flash';
  const prompt = `Crée une courte légende marketing (1 à 3 phrases), en français, adaptée à une publication Facebook ou Instagram. La légende doit mettre en avant le(s) produit(s) visible(s) sur l'image et le style "${options.style}". Inclus une invitation à l'action. Le ton doit être professionnel, inspirant et adapté à une clientèle africaine moderne.`;

  const textPart = { text: prompt };
  
  const response = await getAiInstance().models.generateContent({
    model,
    contents: { parts: [...imageParts, textPart] }
  });

  return response.text.trim();
}

export async function generateImagesAndCaption(
  uploadedImages: UploadedImage[], 
  options: ModelOptions,
  onProgress: (progress: number) => void
) {
  const imageParts = uploadedImages.map(img => fileToGenerativePart(img.base64, img.file.type));
  
  const generatedImages: string[] = [];
  onProgress(0);

  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    const image = await generateSingleImage(imageParts, options, pose);
    generatedImages.push(image);
    const progress = Math.round(((i + 1) / POSES.length) * 100);
    onProgress(progress);
  }

  // Generate caption using the uploaded images for context
  const caption = await generateMarketingCaption(imageParts, options);
  
  return { images: generatedImages, caption };
}