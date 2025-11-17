export enum AppStep {
  Accueil,
  Upload,
  Select,
  Generate,
  Results,
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