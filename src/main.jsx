import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { client } from './lib/appwrite';
import './styles.css';

client.ping()
  .then(() => console.info('Appwrite connection successful.'))
  .catch((error) => console.error('Appwrite connection failed:', error));

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>,
);
