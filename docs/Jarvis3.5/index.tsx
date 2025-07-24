import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // --- ADD THIS LINE ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* --- WRAP APP WITH AUTHPROVIDER --- */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);