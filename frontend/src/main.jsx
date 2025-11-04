import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Initialize theme before render
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const rootEl = document.documentElement;
if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  rootEl.classList.add('dark');
} else {
  rootEl.classList.remove('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer position="top-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
