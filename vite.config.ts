import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs-extra';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Copy the server configuration files to the dist folder during build
  if (mode === 'production') {
    // Ensure the files exist first
    const redirectsContent = '/* /index.html 200';
    const robotsContent = 'User-agent: *\nAllow: /\n\nSitemap: https://yourdomain.com/sitemap.xml';
    
    // Create a hook to copy these files during build
    const copyFiles = () => {
      return {
        name: 'copy-files',
        closeBundle: async () => {
          // Create the files in the dist directory after build
          await fs.ensureDir('./dist');
          await fs.writeFile('./dist/_redirects', redirectsContent);
          await fs.writeFile('./dist/robots.txt', robotsContent);
          // Copy sitemap if it exists in public
          if (fs.existsSync('./public/sitemap.xml')) {
            await fs.copy('./public/sitemap.xml', './dist/sitemap.xml');
          }
        }
      };
    };
  
    return {
      server: {
        host: "::",
        port: 8080,
      },
      plugins: [
        react(),
        copyFiles(),
        mode === 'development' && componentTagger(),
      ].filter(Boolean),
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
    };
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
