// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// *** IMPORT THE SOCKET PROVIDER ***
import { SocketProvider } from './context/SocketContext'; // Adjust path if needed

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* *** WRAP APP WITH PROVIDER *** */}
    <SocketProvider>
      <App />
    </SocketProvider>
  </React.StrictMode>
);

reportWebVitals();