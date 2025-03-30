
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

// Add meta robots tag to ensure proper indexing
const metaRobots = document.querySelector('meta[name="robots"]');
if (!metaRobots) {
  const newMetaRobots = document.createElement('meta');
  newMetaRobots.setAttribute('name', 'robots');
  newMetaRobots.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  document.head.appendChild(newMetaRobots);
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

// Generate route mapping for search engines
const generateRoutesMapping = () => {
  const routes = [
    '/',
    '/about',
    '/contact',
    '/products',
    '/news',
    '/market',
    '/sets',
    '/sets/pokemon',
    '/privacy',
    '/terms',
    '/cookies'
  ];
  
  const routesDiv = document.createElement('div');
  routesDiv.id = 'sitemap-routes';
  routesDiv.style.display = 'none';
  
  routes.forEach(route => {
    const link = document.createElement('a');
    link.href = route;
    link.textContent = route;
    routesDiv.appendChild(link);
    routesDiv.appendChild(document.createElement('br'));
  });
  
  document.getElementById('root')?.appendChild(routesDiv);
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

// Add SEO keywords, route mapping and remove the loader after a short delay
setTimeout(() => {
  addHiddenKeywords();
  generateRoutesMapping();
  removeLoader();
}, 800);
