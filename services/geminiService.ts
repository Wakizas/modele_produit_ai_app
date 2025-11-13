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

export async function detectProduct(productImages: UploadedImage[], maxRetries = 3): Promise<string> {
    const imageParts = productImages.map(img => fileToGenerativePart(img.base64, img.file.type));
    const prompt = "Analyse l'image (ou les images) de ce produit e-commerce. Décris le produit principal en une phrase courte et concise (max 15 mots). Sois très spécifique sur l'article, sa couleur et sa matière si possible. Exemples: 'un t-shirt blanc en coton avec un logo noir', 'une montre dorée avec un bracelet en cuir marron', 'une paire de baskets montantes rouges et blanches'. Ne commence pas par 'Ceci est' ou 'L'image montre'.";
    const textPart = { text: prompt };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await getAiInstance().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [...imageParts, textPart] },
            });

            // The response.text getter will throw an error if generation was blocked.
            const text = response.text;
            
            if (!text || text.trim().length === 0) {
                console.error('Product detection returned an empty description.');
                throw new Error('Empty API response');
            }
            return text.trim();

        } catch (error) {
            console.error(`Product detection attempt ${attempt}/${maxRetries} failed:`, error);
            
            const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();

            // Do not retry on safety errors, fail fast.
            // The API error for safety blocks often contains 'safety'.
            if (errorMessage.includes('safety')) {
                throw new Error('SAFETY_BLOCK');
            }

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 500 + Math.random() * 500; // shorter delay for a quicker task
                console.warn(`Retrying product detection in ${Math.round(delay / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // After all retries, throw a specific error.
                throw new Error('RETRY_FAILED');
            }
        }
    }
    
    // Fallback error
    throw new Error('RETRY_FAILED');
}

const generateImagePrompt = (options: ModelOptions, productDescription: string, pose: string): string => {
  const realismePrompt = "QUALITÉ MAXIMALE ACTIVÉE : Le rendu doit être ultra-réaliste, indiscernable d'une vraie photographie de mode professionnelle. Fais attention aux détails de la peau, des cheveux, des tissus et de la lumière. Le résultat ne doit pas avoir l'air d'avoir été généré par une IA.";
  const formatInstruction = "L'image doit être au format PNG haute définition avec une résolution de 1024x1024 pixels. La composition doit être adaptée à ce format carré.";

  if (options.useMyFace) {
    return `MISSION : INCRUSTATION FACIALE PHOTORÉALISTE SUR UN MANNEQUIN VIRTUEL.

**INPUTS FOURNIS :**
1.  **Images du Produit :** Les premières images. Produit à mettre en avant : "${productDescription}".
2.  **Image de Référence du Visage :** La **TOUTE DERNIÈRE** image. C'est la source **ABSOLUE** pour le visage.

**DIRECTIVES CRITIQUES (ORDRE DE PRIORITÉ) :**

1.  **PRIORITÉ MAXIMALE : CLONAGE DU VISAGE**
    - **Exigence non négociable :** Le visage du mannequin généré doit être une **copie exacte** de l'Image de Référence du Visage.
    - **Détails à copier à l'identique :** Forme des yeux, nez, bouche, mâchoire, grain de peau, etc.
    - **Interdiction :** N'INTERPRÈTE PAS, ne modifie pas, et ne stylise pas le visage. C'est une transplantation faciale. L'échec à reproduire le visage est un échec total de la mission.

2.  **COHÉRENCE CORPORELLE TOTALE**
    - **Teinte de peau :** Le teint de la peau du corps entier du mannequin (cou, mains, bras, etc.) doit **correspondre parfaitement** à celui du visage de référence. Aucune différence ne sera tolérée.
    - **Âge et origine perçus :** L'apparence du corps doit être cohérente avec l'âge et l'origine ethnique perçus sur le visage.
    - **Morphologie :** Applique **strictement** la morphologie demandée : **${options.morphologie}**.

3.  **MISE EN SCÈNE DU PRODUIT**
    - **Intégration :** Le mannequin doit porter le produit ("${productDescription}") de manière naturelle et crédible.
    - **Style :** Le style général doit être : **${options.style}**.
    - **Pose :** Utilise la pose suivante : **"${pose}"**. La pose doit mettre en valeur le produit.
    - **Ambiance :** L'arrière-plan et l'éclairage doivent correspondre à : **"${options.ambiance}"**. L'éclairage sur le mannequin doit être cohérent avec l'ambiance.

4.  **QUALITÉ TECHNIQUE**
    - **Réalisme :** ${realismePrompt}
    - **Format :** ${formatInstruction}

**RÉSUMÉ DE LA MISSION :**
Génère une image d'un mannequin avec le corps et le style décrits, portant le produit. Ensuite, remplace le visage de ce mannequin par une copie **PARFAITE** du visage de référence fourni, en assurant une cohérence absolue de la teinte de peau sur tout le corps.`;
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
- Ambiance et Éclairage : ${options.ambiance}. Cette ambiance doit dicter à la fois l'arrière-plan ET l'éclairage de la scène. La lumière sur le modèle doit être cohérente avec l'ambiance choisie.
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
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await getAiInstance().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, textPart] },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      if (
        !response.candidates ||
        response.candidates.length === 0 ||
        response.candidates[0].finishReason === 'SAFETY' ||
        response.candidates[0].finishReason === 'RECITATION'
      ) {
        console.error('Image generation blocked due to safety/recitation.', { finishReason: response.candidates?.[0]?.finishReason, promptFeedback: response.promptFeedback });
        throw new Error('La génération d\'image a été bloquée par les filtres de sécurité.');
      }

      const imagePart = response.candidates[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart && imagePart.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
      
      console.error('No image data in valid response:', response);
      throw new Error('Aucune image n\'a été générée dans la réponse.');
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      const isSafetyError = error instanceof Error && error.message.includes('sécurité');
      // Do not retry on safety errors, fail fast.
      if (isSafetyError) {
          throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // exponential backoff with jitter
        console.warn(`Retrying in ${Math.round(delay / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // After all retries, throw the original error.
        throw error;
      }
    }
  }
  
  throw new Error('Échec de la génération de l\'image après plusieurs tentatives.');
}


async function generateMarketingCaption(imageParts: any[], options: ModelOptions, productDescription: string): Promise<string> {
  const model = 'gemini-2.5-flash';
  const promptContext = `le produit suivant : "${productDescription}"`;

  const prompt = `Crée une courte légende marketing (1 à 3 phrases), en français, adaptée à une publication Facebook ou Instagram. La légende doit mettre en avant ${promptContext} et le style "${options.style}". Inclus une invitation à l'action. Le ton doit être ${options.tonMarketing}, inspirant et adapté à une clientèle africaine moderne.`;

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