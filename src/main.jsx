import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ConfigErrorScreen from './components/ConfigErrorScreen.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { config } from './lib/config';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {config.errors.length > 0 ? <ConfigErrorScreen errors={config.errors} /> : (
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      )}
    </ErrorBoundary>
  </React.StrictMode>,
);
