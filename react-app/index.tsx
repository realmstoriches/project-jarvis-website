// react-app/index.tsx - FINAL CORRECTED VERSION

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- The necessary router import
import App from './App';
import { AuthProvider } from './context/AuthContext'; // <-- Your existing AuthProvider

const rootElement = document.getElementById('root');
if (!rootElement) {
  // Your existing error check is good practice.
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// The correct wrapping order: Router -> AuthProvider -> App
// This ensures that both routing and authentication context are available to your entire app.
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);