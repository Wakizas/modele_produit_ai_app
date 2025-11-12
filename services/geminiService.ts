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
  const realismePrompt = "QUALITÉ MAXIMALE ACTIVÉE : Le rendu doit être ultra-réaliste, indiscernable d'une vraie photographie de mode professionnelle. Fais attention aux détails de la peau, des cheveux, des tissus et de la lumière. Le résultat ne doit pas avoir l'air d'avoir été généré par une IA.";
  const formatInstruction = "L'image doit être au format PNG haute définition avec une résolution de 1024x1024 pixels. La composition doit être adaptée à ce format carré.";

  if (options.useMyFace) {
    return `PRIORITÉ ABSOLUE : REPRODUCTION FACIALE EXACTE POUR VISUEL PRODUIT.

ANALYSE DES ENTRÉES :
- IMAGES PRODUIT : Toutes les images sauf la dernière. Contiennent le vêtement/accessoire.
- IMAGE VISAGE DE RÉFÉRENCE : C'est la TOUTE DERNIÈRE image fournie. Elle est la source unique et obligatoire pour le visage du modèle.

MISSION PRINCIPALE (NON NÉGOCIABLE) :
Tu dois générer une photo de mannequin de qualité professionnelle. La règle la plus importante est que le visage du mannequin doit être une **REPRODUCTION IDENTIQUE** du visage de l'IMAGE VISAGE DE RÉFÉRENCE. La ressemblance n'est pas une option, c'est une exigence.

RÈGLES IMPÉRATIVES :
1.  **FIDÉLITÉ DU VISAGE (PRIORITÉ N°1)** : Le visage généré doit être indiscernable de celui de l'image de référence. Copie chaque détail : forme des yeux, du nez, de la bouche, mâchoire, teint de la peau. NE PAS interpréter ou modifier les traits. C'est une opération de greffe de visage photoréaliste.
2.  **INTÉGRATION DU PRODUIT** : Le mannequin doit porter le(s) produit(s) de manière naturelle et valorisante.
3.  **CARACTÉRISTIQUES DU MANNEQUIN** :
    - Morphologie : ${options.morphologie}
    - Style général : ${options.style}
    - Pose : ${pose}. La pose doit être naturelle et adaptée au produit.
4.  **QUALITÉ TECHNIQUE** :
    - ${realismePrompt}
    - ${formatInstruction}
5.  **ARRIÈRE-PLAN** : ${options.arrierePlan}. Il doit compléter la scène sans distraire.

ÉCHEC DE LA MISSION SI :
- Le visage du mannequin ne ressemble pas de manière frappante à l'IMAGE VISAGE DE RÉFÉRENCE.
- Le visage semble générique ou "inspiré de" au lieu d'être une copie.

Le succès est défini par une image commercialement viable où le produit est bien présenté sur un mannequin dont le visage est la copie conforme de la référence fournie.`;
  }

  const basePrompt = `CRÉATION D'UN VISUEL PRODUIT PROFESSIONNEL ULTRA-RÉALISTE.
CONTEXTE : Une ou plusieurs images de produits sont fournies. Tu dois les mettre en scène sur un modèle photoréaliste.
MISSION : Intègre le(s) produit(s) des images fournies sur un modèle virtuel, en mettant en évidence le produit principal. Si plusieurs produits sont fournis (ex: chemise, pantalon, montre), habille le modèle avec tous les articles de manière cohérente et naturelle.

RÈGLES STRICTES DU MODÈLE (NON-NÉGOCIABLES) : Le modèle doit EXACTEMENT correspondre aux critères suivants :
- Sexe : ${options.sexe}
- Teinte de peau : ${options.typeDePeau}
- Origine ethnique : ${options.origineEthnique}. Les traits du visage doivent être authentiques et représentatifs de cette origine.
- Morphologie : ${options.morphologie}
- Âge apparent : ${options.age}
- Expression faciale : ${options.expression}.

INSTRUCTIONS DE STYLE ET DE POSE :
- Format de Sortie : ${formatInstruction}
- Style vestimentaire : ${options.style}.
- Pose du modèle : ${pose}. La pose doit être naturelle et mettre en valeur le(s) produit(s).
- ADAPTATION DE LA POSE : La pose doit s'adapter aux produits. Si une montre est présente, le poignet doit être visible. Si des chaussures sont fournies, les pieds doivent être dans le cadre. Pour une tenue complète, une pose en pied est nécessaire.
- Éclairage : Professionnel, type studio photo, pour un rendu luxueux.
- Arrière-plan : ${options.arrierePlan}. L'arrière-plan doit être esthétique mais ne doit pas détourner l'attention du modèle et du produit.
- ${realismePrompt}

OBJECTIF FINAL : Produire une image de qualité photographique, commercialement attractive, qui respecte impérativement toutes les règles ci-dessus. Le(s) produit(s) doi(ven)t être parfaitement intégré(s), sans déformation.`;

  return basePrompt;
};


const POSES = [
  "Pose naturelle et élégante, regardant la caméra avec confiance.",
  "De trois-quarts, montrant le profil du produit principal.",
  "Marche lente et stylée vers la caméra, créant un effet de mouvement.",
  "Adossé à un mur texturé sombre, pose décontractée mais chic."
];

async function generateSingleImageWithRetry(imageParts: any[], options: ModelOptions, pose: string, maxRetries = 3): Promise<string> {
  const prompt = generateImagePrompt(options, pose);
  const textPart = { text: prompt };
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await getAiInstance().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, textPart] },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart && imagePart.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
      throw new Error('Aucune image n\'a été générée dans la réponse.');
    } catch (error) {
      // Check if the error indicates a rate limit/quota issue
      const isRateLimitError = error instanceof Error && (error.message.includes('429') || error.message.toLowerCase().includes('quota'));

      if (isRateLimitError && attempt < maxRetries - 1) {
        // Exponential backoff: wait 2s, then 4s, etc. before retrying
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // If it's not a rate limit error or we've exhausted retries, throw the error
        throw error;
      }
    }
  }
  
  throw new Error('Échec de la génération de l\'image après plusieurs tentatives.');
}


async function generateMarketingCaption(imageParts: any[], options: ModelOptions): Promise<string> {
  const model = 'gemini-2.5-flash';
  const promptContext = "le(s) produit(s) visible(s) sur l'image";

  const prompt = `Crée une courte légende marketing (1 à 3 phrases), en français, adaptée à une publication Facebook ou Instagram. La légende doit mettre en avant ${promptContext} et le style "${options.style}". Inclus une invitation à l'action. Le ton doit être professionnel, inspirant et adapté à une clientèle africaine moderne.`;

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
  onProgress: (progress: number) => void,
  onImageGenerated: (image: string, index: number) => void,
  faceImage: UploadedImage | null
) {
  const imageParts = uploadedImages.map(img => fileToGenerativePart(img.base64, img.file.type));

  if (options.useMyFace && faceImage) {
      const facePart = fileToGenerativePart(faceImage.base64, faceImage.file.type);
      imageParts.push(facePart);
  }

  onProgress(0);

  let completedTasks = 0;
  const totalTasks = POSES.length + 1;

  const updateProgress = () => {
    completedTasks++;
    const progress = Math.min(99, Math.round((completedTasks / totalTasks) * 100));
    onProgress(progress);
  };

  const imageGenerationPromises = POSES.map((pose, index) =>
    generateSingleImageWithRetry(imageParts, options, pose).then(image => {
      onImageGenerated(image, index);
      updateProgress();
      return image;
    })
  );

  const captionPromise = generateMarketingCaption(imageParts, options).then(caption => {
    updateProgress();
    return caption;
  });

  const [images, caption] = await Promise.all([
    Promise.all(imageGenerationPromises),
    captionPromise,
  ]);
  
  onProgress(100);

  return { images, caption };
}