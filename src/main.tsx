
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add Inter font globally
const interFont = document.createElement('link');
interFont.rel = 'stylesheet';
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
document.head.appendChild(interFont);

// Animate the progress bar
const animateProgressBar = () => {
  const progressBar = document.getElementById('initialProgressBar');
  let width = 0;
  
  if (progressBar) {
    const interval = setInterval(() => {
      if (width >= 99) {
        clearInterval(interval);
      } else {
        // Slow down as we approach 100%
        const increment = Math.max(1, Math.floor((100 - width) / 10));
        width = Math.min(99, width + increment);
        progressBar.style.width = width + '%';
      }
    }, 100);
  }
};

// Start animating the progress bar
animateProgressBar();

// Render our app
const root = createRoot(document.getElementById("root")!)
root.render(<App />);

// Remove the loader once the app has rendered
const removeLoader = () => {
  const loader = document.getElementById('initialLoader');
  if (loader) {
    // Set progress to 100% before fading out
    const progressBar = document.getElementById('initialProgressBar');
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.style.transition = 'width 0.3s ease-out';
    }
    
    // Slight delay to show 100% before fading
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.remove();
      }, 500);
    }, 300);
  }
};

// Remove the loader after a short delay
setTimeout(removeLoader, 800);
