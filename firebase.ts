import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT : Cette configuration est chargée à partir de vos variables d'environnement.
// Assurez-vous d'avoir un fichier .env à la racine de votre projet avec les clés correspondantes.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Vérification simple pour s'assurer que les variables sont chargées
if (!firebaseConfig.apiKey) {
  console.error("Erreur de configuration Firebase : Les variables d'environnement ne sont pas définies !");
  // Affichez une erreur plus visible à l'utilisateur
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 2rem; text-align: center; color: white; background-color: #1A1A1A; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
      <h1>Erreur de configuration</h1>
      <p style="max-width: 500px; margin-top: 1rem;">La configuration de Firebase est manquante. Veuillez vérifier que vous avez bien créé un fichier <code>.env</code> à la racine du projet avec les bonnes clés.</p>
    </div>`;
  }
}


// Initialise Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);