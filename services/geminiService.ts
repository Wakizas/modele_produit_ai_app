
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

// Helper function for generating content with retry logic for 503 errors
async function generateTextWithRetry(model: string, parts: any[], maxRetries = 3): Promise<string | undefined> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts }
      });
      return response.text;
    } catch (error: any) {
      const msg = error.message?.toLowerCase() || '';
      // Check for 503 Service Unavailable or Overloaded errors
      if (msg.includes('503') || msg.includes('overloaded')) {
        if (attempt < maxRetries) {
           // Exponential backoff: 2s, 4s, 8s...
           const delay = 1000 * Math.pow(2, attempt);
           console.warn(`Model overloaded (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
        }
      }
      throw error;
    }
  }
  return undefined;
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
    // Use the retry helper to handle 503 errors
    const text = await generateTextWithRetry(model, [...imageParts, { text: prompt }]);
    
    if (!text) return 'default';

    const cleanedText = text.trim().toLowerCase().replace(/[^\w]/g, ''); // Nettoyer la réponse
    const validCategories = ['vêtement', 'bijou', 'chaussures', 'sac', 'lunettes', 'cosmétique', 'default'];
    
    if (validCategories.includes(cleanedText)) {
      return cleanedText;
    }
    return 'default';
  } catch (error) {
    console.error("Erreur lors de l'analyse de la catégorie du produit:", error);
    return 'default'; // Retourner la valeur par défaut en cas d'échec de l'analyse
  }
}


async function generateSingleImageWithRetry(imageParts: any[], options: ModelOptions, pose: string, productDescription: string, maxRetries = 3): Promise<string> {
  const prompt = generateImagePrompt(options, pose, productDescription);
  const textPart = { text: prompt };
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        // Utilisation du modèle Flash Image, optimisé pour la vitesse et le coût
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
        console.error('Image generation blocked due to safety/recitation.', { finishReason: response.candidates?.[0]?.finishReason });
        throw new Error('SAFETY_BLOCK_GENERATION');
      }

      const imagePart = response.candidates[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart && imagePart.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
      
      throw new Error('NO_IMAGE_DATA');
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for pose "${pose}":`, error);
      
      const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
      
      if (errorMessage.includes('safety')) throw new Error('SAFETY_BLOCK_GENERATION');
      if (errorMessage.includes('api key')) throw new Error('API_KEY_INVALID');
      if (errorMessage.includes('billing')) throw new Error('BILLING_NOT_ENABLED');
      
      // Gestion spécifique des quotas pour le plan gratuit et surcharge
      const isQuotaExceeded = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('resource_exhausted');
      const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded');

      if (isQuotaExceeded || isOverloaded) {
           // Si quota dépassé ou surchargé, on attend plus longtemps avant de réessayer
           if (attempt < maxRetries) {
               const delay = isOverloaded ? Math.pow(2, attempt) * 1000 : 5000; // Exponential for overload, fixed 5s for quota
               console.warn(`Service busy/quota hit (attempt ${attempt}), waiting ${delay}ms...`);
               await new Promise(resolve => setTimeout(resolve, delay)); 
               continue;
           }
           if (isOverloaded) throw new Error('MODEL_OVERLOADED');
           throw new Error('QUOTA_EXCEEDED');
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error('RETRY_FAILED_GENERATION');
      }
    }
  }
  
  throw new Error('RETRY_FAILED_GENERATION');
}


async function generateMarketingCaption(imageParts: any[], options: ModelOptions, productDescription: string): Promise<string> {
  const model = 'gemini-2.5-flash';

  const prompt = `Tâche : Rédiger une légende marketing pour Instagram.
Contexte : Tu es un expert en marketing digital. Tu dois analyser les images fournies pour comprendre le produit.
Instructions :
1. Rédige une légende courte et percutante (2 phrases maximum) en français.
2. Incorpore un style qui est "${options.style}".
3. Adopte un ton qui est "${options.tonMarketing}".
4. Termine par un appel à l'action clair.
Réponds uniquement avec la légende finale.`;
  
  try {
    // Use the retry helper to handle 503 errors
    const text = await generateTextWithRetry(model, [...imageParts, { text: prompt }]);
    return text?.trim() || "Découvrez notre nouvelle collection !";
  } catch (error) {
    console.error("Caption generation failed:", error);
    return "Sublimez votre style avec notre nouvelle collection.";
  }
}

export async function generateImagesAndCaption(
  uploadedImages: UploadedImage[],
  options: ModelOptions,
  productDescription: string,
  onProgress: (progress: number) => void,
  onImageGenerated: (image: string, index: number) => void,
  faceImage: UploadedImage | null
) {
  const productImageParts = uploadedImages.map(img => fileToGenerativePart(img.base64, img.file.type));
  
  // 1. Analyse de catégorie (Coût: 1 requête texte - très faible)
  // Now robust against 503 errors
  const productCategory = await getProductCategory(productImageParts);
  console.log(`Catégorie: ${productCategory}`);

  const allImageParts = [...productImageParts];
  if (options.useMyFace && faceImage) {
      const facePart = fileToGenerativePart(faceImage.base64, faceImage.file.type);
      allImageParts.push(facePart);
  }
  
  const POSES = getPosesForProduct(productCategory);
  const totalTasks = POSES.length + 1; // +1 pour la caption
  let completedTasks = 0;
  
  onProgress(5);

  // --- MODE SÉQUENTIEL (FREE TIER FRIENDLY) ---
  // Pour éviter l'erreur 429 (Too Many Requests) du plan gratuit,
  // nous générons les images une par une au lieu de tout lancer en parallèle.
  
  const successfulImages: string[] = [];

  for (let i = 0; i < POSES.length; i++) {
      try {
          // Génération de l'image
          const image = await generateSingleImageWithRetry(allImageParts, options, POSES[i], productDescription);
          successfulImages.push(image);
          onImageGenerated(image, i);
      } catch (err) {
          console.error(`Échec de la génération pour la pose ${i}:`, err);
          // On continue même si une image échoue pour ne pas bloquer tout le processus
      }
      
      completedTasks++;
      onProgress(Math.round((completedTasks / totalTasks) * 90));

      // PETITE PAUSE DE SÉCURITÉ
      // Gemini Free Tier a une limite de requêtes par minute (RPM).
      // Une pause de 1 à 2 secondes entre chaque requête lourde (image) aide à rester sous le radar.
      if (i < POSES.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
      }
  }

  // 2. Génération de la légende (requête légère)
  // Now robust against 503 errors
  const caption = await generateMarketingCaption(productImageParts, options, productDescription);
  onProgress(100);

  if (successfulImages.length === 0) {
      throw new Error("Toutes les tentatives de génération ont échoué. Le service est peut-être surchargé ou votre quota est atteint.");
  }

  return { images: successfulImages, caption };
}
