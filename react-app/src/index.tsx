// react-app/src/index.tsx - FINAL DEFINITIVE VERSION

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // Use HashRouter for robust iframe compatibility
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// The correct wrapping order is critical:
// 1. HashRouter provides routing capabilities.
// 2. AuthProvider provides login information to everything inside it.
// 3. App contains all your components that need routing and login info.
root.render(
  <React.StrictMode>
    <HashRouter> 
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);