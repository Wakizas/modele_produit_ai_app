export enum AppStep {
  Accueil,
  Upload,
  Select,
  Generate,
  Results,
}

export interface ModelOptions {
  sexe: string;
  typeDePeau: string;
  morphologie: string;
  age: string;
  style: string;
  expression: string;
  origineEthnique: string;
  realismeMaximal: boolean;
  outputFormat: string;
  customWidth: number;
  customHeight: number;
}

export interface UploadedImage {
  file: File;
  base64: string;
  previewUrl: string;
}