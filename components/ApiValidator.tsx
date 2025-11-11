import React, { useState, useEffect } from 'react';
import { validateApiKey } from '../services/geminiService';

interface ApiValidatorProps {
  onSuccess: () => void;
}

const LoadingSpinner = () => (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
);

const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mr-3 text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

const ApiValidator: React.FC<ApiValidatorProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<'validating' | 'error'>('validating');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkKey = async () => {
      const result = await validateApiKey();
      if (result.valid) {
        onSuccess();
      } else {
        setErrorMessage(result.error);
        setStatus('error');
      }
    };
    checkKey();
  }, [onSuccess]);

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full bg-dark-card p-8 rounded-2xl shadow-lg border border-red-500/30">
          <div className="flex items-center mb-6">
            <ErrorIcon />
            <h1 className="text-3xl font-bold text-red-400">Erreur de Clé API</h1>
          </div>
          <p className="text-gray-300 mb-4">
            La validation de votre clé API a échoué. Cela signifie que l'application ne peut pas communiquer avec l'IA de Google.
          </p>
          <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30 text-red-300">
            <p className="font-semibold">Message d'erreur :</p>
            <p>{errorMessage}</p>
          </div>
          <p className="text-gray-400 mt-6 mb-6">
            Veuillez vérifier que votre clé est correcte, que l'API "Generative Language" est bien activée sur votre projet Google Cloud, et que la facturation est configurée (même pour l'usage gratuit).
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-primary text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:bg-accent transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            Vérifier ma Clé sur Google AI Studio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <LoadingSpinner />
      <h2 className="text-2xl font-semibold text-white mt-6">Vérification de la clé API...</h2>
      <p className="text-gray-400">Connexion aux services Google AI.</p>
    </div>
  );
};

export default ApiValidator;
