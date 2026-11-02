import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ConfigErrorScreen from './components/ConfigErrorScreen.jsx';
import { config } from './lib/config';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {config.errors.length > 0 ? <ConfigErrorScreen errors={config.errors} /> : (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>,
);
