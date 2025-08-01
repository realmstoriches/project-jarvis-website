// react-app/src/index.tsx - DEFINITIVELY CORRECTED

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css'; // This line imports all your Tailwind styles

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Fatal Error: Root element not found.");
}

const root = ReactDOM.createRoot(rootElement);

// THE CORRECT HIERARCHY: Router -> Provider -> App
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);