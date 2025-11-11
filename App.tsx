import React, { useState } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import ApiValidator from './components/ApiValidator';
import MainApp from './MainApp';

// FIX: Define `process` for browser environments to allow access to environment variables.
// This avoids TypeScript errors for `process.env` and removes the need for vite/client types.
declare const process: {
  env: {
    API_KEY?: string;
  };
};

export default function App() {
  // FIX: Use process.env.API_KEY to align with Gemini API guidelines.
  // The value is injected at build time by Vite's `define` config.
  if (!process.env.API_KEY) {
    return <ApiKeySetup />;
  }

  const [isKeyValidated, setIsKeyValidated] = useState(false);

  if (!isKeyValidated) {
    return <ApiValidator onSuccess={() => setIsKeyValidated(true)} />;
  }

  return <MainApp />;
}
