
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seoKeywords } from './config/seo'

// Add Inter font globally
const interFont = document.createElement('link');
interFont.rel = 'stylesheet';
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
document.head.appendChild(interFont);

// Set meta keywords from config
const metaKeywords = document.querySelector('meta[name="keywords"]');
if (metaKeywords) {
  metaKeywords.setAttribute('content', seoKeywords.metaKeywords);
} else {
  const newMetaKeywords = document.createElement('meta');
  newMetaKeywords.setAttribute('name', 'keywords');
  newMetaKeywords.setAttribute('content', seoKeywords.metaKeywords);
  document.head.appendChild(newMetaKeywords);
}

// Render our app
const root = createRoot(document.getElementById("root")!)
root.render(<App />);

// Add hidden SEO keywords to the DOM
const addHiddenKeywords = () => {
  const existingKeywordsDiv = document.querySelector('#hidden-seo-keywords');
  if (!existingKeywordsDiv) {
    const keywordsDiv = document.createElement('div');
    keywordsDiv.id = 'hidden-seo-keywords';
    keywordsDiv.style.display = 'none';
    keywordsDiv.textContent = seoKeywords.hiddenKeywords;
    document.getElementById('root')?.appendChild(keywordsDiv);
  }
};

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

// Add SEO keywords and remove the loader after a short delay
setTimeout(() => {
  addHiddenKeywords();
  removeLoader();
}, 800);
