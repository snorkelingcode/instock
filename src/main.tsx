
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add Inter font globally
const interFont = document.createElement('link');
interFont.rel = 'stylesheet';
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
document.head.appendChild(interFont);

// Add additional SEO meta tags
const addSeoTags = () => {
  // Add mobile-friendly meta tag
  const viewportMeta = document.createElement('meta');
  viewportMeta.name = 'viewport';
  viewportMeta.content = 'width=device-width, initial-scale=1.0';
  document.head.appendChild(viewportMeta);
  
  // Add robots meta tag
  const robotsMeta = document.createElement('meta');
  robotsMeta.name = 'robots';
  robotsMeta.content = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  document.head.appendChild(robotsMeta);
  
  // Add language meta tag
  const languageMeta = document.createElement('meta');
  languageMeta.httpEquiv = 'Content-Language';
  languageMeta.content = 'en-US';
  document.head.appendChild(languageMeta);
  
  // Add base meta tags for SEO
  const authorMeta = document.createElement('meta');
  authorMeta.name = 'author';
  authorMeta.content = 'TCG Updates';
  document.head.appendChild(authorMeta);
};

// Initialize SEO tags
addSeoTags();

// Function to remove the loader
const removeLoader = () => {
  const loader = document.getElementById('initialLoader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.remove();
    }, 500); // Matches the fadeOut animation duration
  }
};

// Render our app
const root = createRoot(document.getElementById("root")!)
root.render(<App />);

// Remove the loader once the app has rendered
// Using a small delay to ensure everything is loaded properly
setTimeout(removeLoader, 800);
