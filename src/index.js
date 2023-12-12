import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { retryPendingEmails } from './RetryEmails';
export const emailStatus = {
  stored: false
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar el Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}





// Función para verificar la conexión a Internet
const checkInternetConnection = () => {
  return fetch('https://www.google.com', { mode: 'no-cors' })
    .then(() => {
      return true;  // La solicitud fue exitosa, hay conexión a Internet
    })
    .catch(() => {
      return false;  // Hubo un error, asumimos que no hay conexión
    });
};

// Verifica la conexión a intervalos regulares
setInterval(async () => {
  const isConnected = await checkInternetConnection();
  console.log("Conectado a Internet:", isConnected);
  console.log(localStorage.length);
  if (isConnected && localStorage.length > 0) {
    console.log("Un email ha sido almacenado.");
    retryPendingEmails();
  }
}, 5000);








// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
