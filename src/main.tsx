
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add Inter font globally
const interFont = document.createElement('link');
interFont.rel = 'stylesheet';
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
document.head.appendChild(interFont);

// Render our app
const root = createRoot(document.getElementById("root")!)
root.render(<App />);

// Remove the loader once the app has rendered
const removeLoader = () => {
  const loader = document.getElementById('initialLoader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.remove();
    }, 500);
  }
};

// Remove the loader after a short delay
setTimeout(removeLoader, 800);
