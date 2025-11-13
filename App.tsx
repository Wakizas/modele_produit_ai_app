import React from 'react';
import MainApp from './MainApp';

export default function App() {
  // Le flux de sélection de clé a été supprimé pour un déploiement en production.
  // L'application suppose que process.env.API_KEY est défini via les variables
  // d'environnement de la plateforme de déploiement (ex: Netlify).
  return <MainApp />;
}