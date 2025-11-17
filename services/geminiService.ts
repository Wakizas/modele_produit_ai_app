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

// REFACTORED AND SIMPLIFIED PROMPT FOR BETTER RELIABILITY
const generateImagePrompt = (options: ModelOptions, pose: string, productDescription: string): string => {
  const qualityPrompt = "Rendu ultra-réaliste, qualité photo professionnelle (8K). Attention aux détails de la peau, des textures de tissu et à un éclairage naturel. Le résultat ne doit pas avoir l'air artificiel.";

  if (options.useMyFace) {
    return `
Prompt: Crée une image photoréaliste d'un mannequin avec les caractéristiques suivantes, intégrant un produit et un visage spécifique à partir des images fournies.

**Images Fournies:**
- Les premières images contiennent le ou les produits à intégrer.
- La TOUTE DERNIÈRE image est la photo de référence pour le visage.

**Instructions (Par Ordre de Priorité):**

1.  **Visage (Priorité Absolue):** Le visage du mannequin doit être une **copie exacte** de celui de l'image de référence. La forme des yeux, du nez, de la bouche, le grain de peau doivent être identiques. Le teint de la peau du corps entier (cou, mains, etc.) doit correspondre parfaitement à celui du visage.

2.  **Mannequin & Produit:**
    -   **Produit à porter:** ${productDescription || 'Le produit visible dans les images fournies'}.
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
-   **Produit à porter:** ${productDescription || 'Le produit visible dans les images fournies'}.
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
    'vêtement': [
        "Pose de face, naturelle et élégante, regardant la caméra avec confiance.",
        "De trois-quarts, une main sur la hanche, mettant en valeur la coupe du vêtement.",
        "En mouvement, comme si le modèle marchait nonchalamment vers la caméra.",
        "Assis sur un cube simple, coude sur le genou, pose décontractée mais chic.",
        "De dos, regardant par-dessus l'épaule, pour montrer les détails arrière."
    ],
    'bijou': [
        "Gros plan sur le poignet pour une montre/bracelet, visage en arrière-plan flou.",
        "Main posée délicatement sur le cou pour mettre en valeur un collier.",
        "Portrait en gros plan, main près de l'oreille pour montrer des boucles d'oreilles.",
        "Main posée nonchalamment sur le menton, exposant une bague.",
        "Le modèle ajuste son col de chemise, rendant un bijou de poignet bien visible."
    ],
    'chaussures': [
        "Une jambe croisée sur l'autre en position assise, gros plan sur la chaussure.",
        "Le modèle fait un pas en avant, caméra au niveau du sol.",
        "Adossé à un mur, une jambe pliée, la semelle visible.",
        "Assis sur des marches, les pieds au premier plan pour un look urbain.",
        "En train de sauter, montrant la flexibilité (pour des baskets)."
    ],
    'sac': [
        "Le sac tenu à la main, bras le long du corps, vue de face.",
        "Le sac porté à l'épaule, le modèle de trois-quarts pour montrer comment il tombe.",
        "Le modèle en train de marcher, le sac en mouvement naturel.",
        "Gros plan sur le sac posé à côté du modèle assis.",
        "En bandoulière, le modèle interagissant avec le sac."
    ],
    'lunettes': [
        "Portrait de face, le modèle ajustant les lunettes sur son nez.",
        "Profil du visage, pour montrer le design des branches.",
        "Le modèle regarde au loin, donnant un aspect naturel.",
        "Vue de dessus, le modèle regardant vers le haut, créant un effet dramatique.",
        "Le modèle tenant les lunettes à la main, regard pensif."
    ],
    'cosmétique': [
        "Portrait beauté en gros plan, mettant en valeur le maquillage (lèvres, yeux).",
        "Le modèle appliquant délicatement le produit (crème, sérum) sur son visage.",
        "Main tenant le flacon du produit près du visage, focus sur le packaging.",
        "Sourire radieux montrant un teint parfait grâce à un fond de teint.",
        "Vue de profil pour mettre en avant un highlighter sur les pommettes."
    ],
    'default': [
        "Pose de face, naturelle et élégante, regardant la caméra avec confiance.",
        "De trois-quarts, une main sur la hanche, pour un look classique.",
        "En mouvement, comme si le modèle marchait nonchalamment vers la caméra.",
        "Assis sur un cube simple, coude sur le genou, pose décontractée.",
        "Portrait en buste, regard direct et confiant."
    ]
};

function getPosesForProduct(category: string): string[] {
    const lowerCaseCategory = category.toLowerCase();
    // Assurer que le tableau retourné a toujours 5 éléments pour la cohérence de l'interface utilisateur
    const poses = POSES_MAPPING[lowerCaseCategory] || POSES_MAPPING['default'];
    return poses.slice(0, 5);
}

async function getProductCategory(imageParts: any[]): Promise<string> {
  const model = 'gemini-2.5-flash';
  const prompt = `Analyse l'image du produit fournie et identifie sa catégorie. Réponds avec UN SEUL mot parmi les suivants : vêtement, bijou, chaussures, sac, lunettes, cosmétique. Si tu ne peux pas déterminer la catégorie ou s'il s'agit d'autre chose, réponds 'default'.`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [...imageParts, { text: prompt }] }
    });
    const text = response.text.trim().toLowerCase().replace(/[^\w]/g, ''); // Nettoyer la réponse
    
    const validCategories = ['vêtement', 'bijou', 'chaussures', 'sac', 'lunettes', 'cosmétique', 'default'];
    if (validCategories.includes(text)) {
      return text;
    }
    
    console.warn(`Catégorie non valide retournée par l'IA : "${text}". Utilisation de la catégorie par défaut.`);
    return 'default';
  } catch (error) {
    console.error("Erreur lors de l'analyse de la catégorie du produit:", error);
    return 'default'; // Retourner la valeur par défaut en cas d'échec de l'analyse
  }
}


async function generateSingleImageWithRetry(imageParts: any[], options: ModelOptions, pose: string, productDescription: string, maxRetries = 2): Promise<string> {
  const prompt = generateImagePrompt(options, pose, productDescription);
  const textPart = { text: prompt };
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        // FIX: The `gemini-pro-vision` model is deprecated for this task. Use `gemini-2.5-flash-image` for image generation.
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

  const prompt = `Tâche : Rédiger une légende marketing pour Instagram.
Contexte : Tu es un expert en marketing digital. Tu dois analyser les images fournies pour comprendre le produit. Aucune description textuelle du produit n'est fournie, base-toi uniquement sur le visuel.
Instructions :
1. Rédige une légende courte et percutante (2 phrases maximum) en français.
2. Incorpore un style qui est "${options.style}".
3. Adopte un ton qui est "${options.tonMarketing}".
4. Termine par un appel à l'action clair (ex: "Shoppez le look !", "Découvrez la collection en bio.").
Réponds uniquement avec la légende finale.`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [...imageParts, { text: prompt }] }
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
  // Parts for caption generation (product only)
  const productImageParts = uploadedImages.map(img => fileToGenerativePart(img.base64, img.file.type));
  
  // Analyser les images du produit pour déterminer la catégorie pour les poses
  const productCategory = await getProductCategory(productImageParts);
  console.log(`Catégorie du produit détectée : ${productCategory}`);

  // Parts for image generation (product + optional face)
  const allImageParts = [...productImageParts];
  if (options.useMyFace && faceImage) {
      const facePart = fileToGenerativePart(faceImage.base64, faceImage.file.type);
      allImageParts.push(facePart);
  }
  
  const POSES = getPosesForProduct(productCategory);
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
    generateSingleImageWithRetry(allImageParts, options, pose, productDescription).then(image => {
      onImageGenerated(image, index);
      updateProgress();
      return image;
    })
  );

  const captionPromise = generateMarketingCaption(productImageParts, options, productDescription).then(caption => {
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