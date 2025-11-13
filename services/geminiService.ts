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

export async function detectProduct(productImages: UploadedImage[]): Promise<string> {
    const imageParts = productImages.map(img => fileToGenerativePart(img.base64, img.file.type));
    const prompt = "Analyse l'image (ou les images) de ce produit e-commerce. Décris le produit principal en une phrase courte et concise (max 15 mots). Sois très spécifique sur l'article, sa couleur et sa matière si possible. Exemples: 'un t-shirt blanc en coton avec un logo noir', 'une montre dorée avec un bracelet en cuir marron', 'une paire de baskets montantes rouges et blanches'. Ne commence pas par 'Ceci est' ou 'L'image montre'.";
    const textPart = { text: prompt };

    const response = await getAiInstance().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, textPart] },
    });

    return response.text.trim();
}

const generateImagePrompt = (options: ModelOptions, productDescription: string, pose: string): string => {
  const realismePrompt = "QUALITÉ MAXIMALE ACTIVÉE : Le rendu doit être ultra-réaliste, indiscernable d'une vraie photographie de mode professionnelle. Fais attention aux détails de la peau, des cheveux, des tissus et de la lumière. Le résultat ne doit pas avoir l'air d'avoir été généré par une IA.";
  const formatInstruction = "L'image doit être au format PNG haute définition avec une résolution de 1024x1024 pixels. La composition doit être adaptée à ce format carré.";

  if (options.useMyFace) {
    return `PRIORITÉ ABSOLUE : REPRODUCTION FACIALE EXACTE POUR VISUEL PRODUIT.

ANALYSE DES ENTRÉES :
- IMAGES PRODUIT : Toutes les images sauf la dernière. Elles contiennent le produit suivant : ${productDescription}.
- IMAGE VISAGE DE RÉFÉRENCE : C'est la TOUTE DERNIÈRE image fournie. Elle est la source unique et obligatoire pour le visage du modèle.

MISSION PRINCIPALE (NON NÉGOCIABLE) :
Tu dois générer une photo de mannequin de qualité professionnelle. La règle la plus importante est que le visage du mannequin doit être une **REPRODUCTION IDENTIQUE** du visage de l'IMAGE VISAGE DE RÉFÉRENCE. La ressemblance n'est pas une option, c'est une exigence.

RÈGLES IMPÉRATIVES :
1.  **FIDÉLITÉ DU VISAGE (PRIORITÉ N°1)** : Le visage généré doit être indiscernable de celui de l'image de référence. Copie chaque détail : forme des yeux, du nez, de la bouche, mâchoire, teint de la peau. NE PAS interpréter ou modifier les traits. C'est une opération de greffe de visage photoréaliste.
2.  **INTÉGRATION DU PRODUIT** : Le mannequin doit porter le produit (${productDescription}) de manière naturelle et valorisante.
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
CONTEXTE : Le produit à mettre en scène est : "${productDescription}". Tu dois l'intégrer sur un modèle photoréaliste.
MISSION : Habille le modèle virtuel avec le produit (${productDescription}) de manière naturelle et esthétique.

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
- Pose du modèle : ${pose}. La pose doit être naturelle et spécifiquement choisie pour mettre en valeur le produit "${productDescription}".
- Éclairage : Professionnel, type studio photo, pour un rendu luxueux.
- Arrière-plan : ${options.arrierePlan}. L'arrière-plan doit être esthétique mais ne doit pas détourner l'attention du modèle et du produit.
- ${realismePrompt}

OBJECTIF FINAL : Produire une image de qualité photographique, commercialement attractive, qui respecte impérativement toutes les règles ci-dessus. Le produit doit être parfaitement intégré, sans déformation.`;

  return basePrompt;
};


const POSES_MAPPING: { [key: string]: string[] } = {
    'default': [
        "Pose de face, naturelle et élégante, regardant la caméra avec confiance.",
        "De trois-quarts, une main sur la hanche, mettant en valeur la coupe du vêtement.",
        "En mouvement, comme si le modèle marchait nonchalamment vers la caméra, créant un effet dynamique.",
        "Assis sur un cube simple, coude sur le genou, pose décontractée mais chic.",
        "De dos, regardant par-dessus l'épaule, idéal pour montrer les détails arrière d'un vêtement."
    ],
    'montre|bijou|bracelet|bague': [
        "Gros plan sur le poignet ou la main pour mettre en évidence le bijou, le visage du modèle étant en arrière-plan flou.",
        "Le modèle ajuste son col de chemise ou sa cravate, rendant la montre/bracelet bien visible.",
        "Main posée nonchalamment sur le menton, exposant clairement le produit au poignet.",
        "Pose où le modèle tient un objet (tasse, livre), montrant le produit en action.",
        "Bras croisés, mettant en évidence les bijoux sur les deux poignets."
    ],
    'chaussures|baskets|sandales|talons|bottes': [
        "Une jambe croisée sur l'autre en position assise, pour un gros plan sur la chaussure.",
        "Le modèle fait un pas en avant, la caméra étant au niveau du sol pour focaliser sur les chaussures.",
        "Pose en pied avec un pied légèrement en avant pour montrer le profil de la chaussure.",
        "Adossé à un mur, une jambe pliée, la semelle de la chaussure visible.",
        "Le modèle en train de lacer une de ses chaussures."
    ],
     'sac|sacoche|cartable|pochette': [
        "Le sac tenu à la main, le bras le long du corps, vue de face.",
        "Le sac porté à l'épaule, le modèle de trois-quarts pour montrer comment il tombe.",
        "Le modèle en train de marcher, le sac en mouvement naturel.",
        "Gros plan sur le modèle ouvrant le sac ou y cherchant quelque chose.",
        "Le sac posé sur une surface à côté du modèle assis."
    ],
    'lunettes': [
        "Portrait de face, le modèle ajustant les lunettes sur son nez.",
        "Profil du visage, pour montrer le design des branches des lunettes.",
        "Le modèle regarde au loin, donnant un aspect naturel au port des lunettes.",
        "Le modèle tenant les lunettes à la main, près du visage.",
        "Vue de trois-quarts, un léger sourire, mettant en valeur le style des lunettes."
    ]
};

function getPosesForProduct(productDescription: string): string[] {
    const description = productDescription.toLowerCase();
    for (const key in POSES_MAPPING) {
        const keywords = key.split('|');
        if (keywords.some(keyword => description.includes(keyword))) {
            return POSES_MAPPING[key];
        }
    }
    return POSES_MAPPING['default'];
}

async function generateSingleImageWithRetry(imageParts: any[], options: ModelOptions, productDescription: string, pose: string, maxRetries = 3): Promise<string> {
  const prompt = generateImagePrompt(options, productDescription, pose);
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
      const isRateLimitError = error instanceof Error && (error.message.includes('429') || error.message.toLowerCase().includes('quota'));

      if (isRateLimitError && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Échec de la génération de l\'image après plusieurs tentatives.');
}


async function generateMarketingCaption(imageParts: any[], options: ModelOptions, productDescription: string): Promise<string> {
  const model = 'gemini-2.5-flash';
  const promptContext = `le produit suivant : "${productDescription}"`;

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
  productDescription: string,
  onProgress: (progress: number) => void,
  onImageGenerated: (image: string, index: number) => void,
  faceImage: UploadedImage | null
) {
  const imageParts = uploadedImages.map(img => fileToGenerativePart(img.base64, img.file.type));

  if (options.useMyFace && faceImage) {
      const facePart = fileToGenerativePart(faceImage.base64, faceImage.file.type);
      imageParts.push(facePart);
  }
  
  const POSES = getPosesForProduct(productDescription);

  onProgress(0);

  let completedTasks = 0;
  const totalTasks = POSES.length + 1; // 5 images + 1 caption

  const updateProgress = () => {
    completedTasks++;
    const progress = Math.min(99, Math.round((completedTasks / totalTasks) * 100));
    onProgress(progress);
  };

  const imageGenerationPromises = POSES.map((pose, index) =>
    generateSingleImageWithRetry(imageParts, options, productDescription, pose).then(image => {
      onImageGenerated(image, index);
      updateProgress();
      return image;
    })
  );

  const captionPromise = generateMarketingCaption(imageParts, options, productDescription).then(caption => {
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