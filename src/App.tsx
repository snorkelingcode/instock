
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import News from "./pages/News";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService"; 
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

// Component to handle redirects from the 404.html page
const RedirectHandler = () => {
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    // Check for the redirect path in sessionStorage
    const storedPath = sessionStorage.getItem('spa_redirect_path');
    if (storedPath) {
      sessionStorage.removeItem('spa_redirect_path');
      setRedirectPath(storedPath);
    }
  }, []);

  // If we have a redirect path, navigate to it
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RedirectHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/products" element={<Products />} />
            <Route path="/news" element={<News />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
