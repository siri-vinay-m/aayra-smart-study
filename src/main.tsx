import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting application initialization');
console.log('main.tsx: Document ready state:', document.readyState);
console.log('main.tsx: Location:', window.location.href);

try {
  // Get the root element
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('main.tsx: Root element not found!');
    throw new Error('Root element with id "root" not found');
  }
  
  console.log('main.tsx: Root element found:', rootElement);
  
  // Create React root
  console.log('main.tsx: Creating React root');
  const root = createRoot(rootElement);
  
  console.log('main.tsx: Rendering App component');
  root.render(<App />);
  console.log('main.tsx: App rendered successfully');
  
} catch (error) {
  console.error('main.tsx: Error during initialization:', error);
  
  // Fallback: show error message in the DOM
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        width: 100vw;
        height: 100vh;
        background: #ff4444;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        text-align: center;
      ">
        <div>
          <h1>❌ Application Error</h1>
          <p>Failed to initialize React application</p>
          <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-top: 20px;">${error.message}</pre>
        </div>
      </div>
    `;
  }
}
