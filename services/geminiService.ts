import { GoogleGenAI, Modality } from '@google/genai';
import { ModelOptions, UploadedImage } from '../types';

// La clé API est garantie d'être présente par la configuration de Vite (define)
// qui la récupère depuis les variables d'environnement du build (ex: Netlify).
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [...imageParts, textPart] },
            });

            const text = response.text;
            
            if (!text || text.trim().length === 0) {
                console.error('Product detection returned an empty description.');
                throw new Error('Empty API response');
            }
            return text.trim();

        } catch (error) {
            console.error(`Product detection attempt ${attempt}/${maxRetries} failed:`, error);
            
            const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();

            if (errorMessage.includes('safety')) {
                throw new Error('SAFETY_BLOCK');
            }
            if (errorMessage.includes('api key not valid')) {
                throw new Error('API_KEY_INVALID');
            }
            if (errorMessage.includes('billing')) {
                throw new Error('BILLING_NOT_ENABLED');
            }
            if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                throw new Error('QUOTA_EXCEEDED');
            }

            const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded');

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 500 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                if (isOverloaded) {
                    throw new Error('MODEL_OVERLOADED');
                }
                throw new Error('RETRY_FAILED');
            }
        }
    }
    
    throw new Error('RETRY_FAILED');
}

// REFACTORED AND SIMPLIFIED PROMPT FOR BETTER RELIABILITY
const generateImagePrompt = (options: ModelOptions, productDescription: string, pose: string): string => {
  const qualityPrompt = "Rendu ultra-réaliste, qualité photo professionnelle (8K). Attention aux détails de la peau, des textures de tissu et à un éclairage naturel. Le résultat ne doit pas avoir l'air artificiel.";

  if (options.useMyFace) {
    return `
Prompt: Crée une image photoréaliste d'un mannequin avec les caractéristiques suivantes, intégrant un produit et un visage spécifique à partir des images fournies.

**Images Fournies:**
- Les premières images contiennent le produit à intégrer.
- La TOUTE DERNIÈRE image est la photo de référence pour le visage.

**Instructions (Par Ordre de Priorité):**

1.  **Visage (Priorité Absolue):** Le visage du mannequin doit être une **copie exacte** de celui de l'image de référence. La forme des yeux, du nez, de la bouche, le grain de peau doivent être identiques. Le teint de la peau du corps entier (cou, mains, etc.) doit correspondre parfaitement à celui du visage.

2.  **Mannequin & Produit:**
    -   **Produit à porter:** "${productDescription}". Il doit être porté de manière naturelle.
    -   **Morphologie du corps:** ${options.morphologie}.
    -   **Style général:** ${options.style}.
    -   **Pose:** "${pose}".
    -   **Ambiance & Éclairage:** Scène avec une ambiance de "${options.ambiance}". L'éclairage sur le modèle doit être cohérent.

3.  **Qualité & Format:**
    -   **Qualité:** ${qualityPrompt}
    -   **Format:** Image carrée haute résolution.
`;
  }

  return `
Prompt: Crée une image photoréaliste de qualité professionnelle d'un mannequin mettant en valeur un produit.

**1. Détails du Mannequin (Obligatoire):**
-   **Sexe:** ${options.sexe}
-   **Origine Ethnique:** ${options.origineEthnique} (les traits du visage doivent être authentiques)
-   **Teinte de peau:** ${options.typeDePeau}
-   **Âge Apparent:** ${options.age}
-   **Morphologie:** ${options.morphologie}
-   **Expression Faciale:** ${options.expression}

**2. Détails du Produit & Style:**
-   **Produit à porter:** "${productDescription}".
-   **Style vestimentaire général:** ${options.style}.

**3. Scène & Pose:**
-   **Pose:** Le mannequin doit adopter la pose suivante: "${pose}". La pose doit mettre en valeur le produit.
-   **Ambiance & Éclairage:** L'arrière-plan et l'éclairage doivent correspondre à: "${options.ambiance}".

**4. Qualité Technique:**
-   **Qualité:** ${qualityPrompt}
-   **Format:** Image carrée haute résolution.
`;
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
    ],
    'chaussures|baskets|sandales|talons|bottes': [
        "Une jambe croisée sur l'autre en position assise, pour un gros plan sur la chaussure.",
        "Le modèle fait un pas en avant, la caméra étant au niveau du sol pour focaliser sur les chaussures.",
        "Adossé à un mur, une jambe pliée, la semelle de la chaussure visible.",
    ],
     'sac|sacoche|cartable|pochette': [
        "Le sac tenu à la main, le bras le long du corps, vue de face.",
        "Le sac porté à l'épaule, le modèle de trois-quarts pour montrer comment il tombe.",
        "Le modèle en train de marcher, le sac en mouvement naturel.",
    ],
    'lunettes': [
        "Portrait de face, le modèle ajustant les lunettes sur son nez.",
        "Profil du visage, pour montrer le design des branches des lunettes.",
        "Le modèle regarde au loin, donnant un aspect naturel au port des lunettes.",
    ]
};

function getPosesForProduct(productDescription: string): string[] {
    const description = productDescription.toLowerCase();
    for (const key in POSES_MAPPING) {
        const keywords = key.split('|');
        if (keywords.some(keyword => description.includes(keyword))) {
            return POSES_MAPPING[key].slice(0, 5); // Ensure we always get 5
        }
    }
    return POSES_MAPPING['default'];
}

async function generateSingleImageWithRetry(imageParts: any[], options: ModelOptions, productDescription: string, pose: string, maxRetries = 2): Promise<string> {
  const prompt = generateImagePrompt(options, productDescription, pose);
  const textPart = { text: prompt };
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
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
        throw new Error('SAFETY_BLOCK_GENERATION');
      }

      const imagePart = response.candidates[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart && imagePart.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
      
      console.error('No image data in valid response:', response);
      throw new Error('NO_IMAGE_DATA');
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for pose "${pose}":`, error);
      
      const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
      
      if (errorMessage.includes('safety')) {
          throw new Error('SAFETY_BLOCK_GENERATION');
      }
      if (errorMessage.includes('api key not valid')) {
           throw new Error('API_KEY_INVALID');
      }
      if (errorMessage.includes('billing')) {
           throw new Error('BILLING_NOT_ENABLED');
      }
       if (errorMessage.includes('429') || errorMessage.includes('quota')) {
           throw new Error('QUOTA_EXCEEDED');
      }
      
      const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded');

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`Retrying in ${Math.round(delay / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (isOverloaded) {
          throw new Error('MODEL_OVERLOADED');
        }
        throw new Error('RETRY_FAILED_GENERATION');
      }
    }
  }
  
  throw new Error('RETRY_FAILED_GENERATION');
}


async function generateMarketingCaption(imageParts: any[], options: ModelOptions, productDescription: string, maxRetries = 3): Promise<string> {
  const model = 'gemini-2.5-flash';
  const promptContext = `le produit suivant : "${productDescription}"`;

  const prompt = `Crée une courte légende marketing (2 phrases max), en français, pour une publication Instagram. La légende doit mettre en avant ${promptContext} avec un style "${options.style}". Inclus un appel à l'action. Le ton doit être ${options.tonMarketing}.`;

  const textPart = { text: prompt };
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [...imageParts, textPart] }
      });
      const text = response.text;
      if (!text || text.trim().length === 0) {
        throw new Error('Empty API response for caption');
      }
      return text.trim();
    } catch (error) {
      console.error(`Caption generation attempt ${attempt}/${maxRetries} failed:`, error);
      
      const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();

      // Non-retryable errors
      if (errorMessage.includes('safety')) {
          throw new Error('SAFETY_BLOCK_CAPTION');
      }
      if (errorMessage.includes('api key not valid')) {
           throw new Error('API_KEY_INVALID');
      }
      if (errorMessage.includes('billing')) {
           throw new Error('BILLING_NOT_ENABLED');
      }
      
      const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded');
      const isQuotaExceeded = errorMessage.includes('429') || errorMessage.includes('quota');

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Failed to generate marketing caption after retries.');
        if (isOverloaded) {
          throw new Error('MODEL_OVERLOADED');
        }
        if (isQuotaExceeded) {
          throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error('RETRY_FAILED_CAPTION');
      }
    }
  }
  throw new Error('RETRY_FAILED_CAPTION'); // Should not be reached
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
  const totalPoses = POSES.length;

  onProgress(0);

  let completedTasks = 0;
  const totalTasks = totalPoses + 1; // N images + 1 caption

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

  // Use Promise.allSettled to continue even if some images fail
  const results = await Promise.allSettled([
      ...imageGenerationPromises,
      captionPromise
  ]);

  const successfulImages = results.slice(0, totalPoses)
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<string>).value);

  const captionResult = results[totalPoses];
  const caption = captionResult.status === 'fulfilled' ? (captionResult as PromiseFulfilledResult<string>).value : "Découvrez ce produit exceptionnel ! Visitez notre boutique.";

  if (captionResult.status === 'rejected') {
    console.error("Marketing caption generation failed. Using a default caption. Reason:", captionResult.reason);
  }

  // If all image generations failed, we should throw an error.
  if (successfulImages.length === 0) {
      const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
      throw firstError?.reason || new Error("ALL_GENERATIONS_FAILED");
  }
  
  onProgress(100);

  return { images: successfulImages, caption };
}