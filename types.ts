
export enum AppStep {
  Accueil,
  Auth,
  Upload,
  Select,
  Generate,
  Results,
  Profile,
  Admin,
  Community,
}

export interface ModelOptions {
  sexe: string;
  typeDePeau: string; // 'noir', 'clair', 'blanc', 'asiatique', 'métis'
  morphologie: string; // 'athlétique', 'standard', 'mince', 'enrobée'
  age: string;
  style: string; // 'casual', 'professionnel', 'chic', 'traditionnel', 'sportif'
  expression: string;
  origineEthnique: string;
  ambiance: string;
  tonMarketing: string;
  useMyFace: boolean;
}

export interface UploadedImage {
  file: File;
  base64: string;
  previewUrl: string;
}

export interface CommunityCreation {
  id: string;
  style: string;
  ambiance: string;
  morphologie: string;
  likes: number;
  likedBy?: string[]; // Array of user IDs who liked this
  author: string;
  gradient: string;
  authorUid: string;
}
