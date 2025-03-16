
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import News from "./pages/News";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService"; 
import CookiePolicy from "./pages/CookiePolicy";
import Sets from "./pages/Sets";
import Auth from "./pages/Auth";
import AdminArticles from "./pages/admin/AdminArticles";
import ArticleEditor from "./components/admin/ArticleEditor";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import PokemonSets from "./pages/TCGSets/PokemonSets";
import PokemonSetDetails from "./pages/TCGSets/PokemonSetDetails";
import MTGSets from "./pages/TCGSets/MTGSets";
import YugiohSets from "./pages/TCGSets/YugiohSets";
import LorcanaSets from "./pages/TCGSets/LorcanaSets";
import SetSyncPage from "./pages/TCGSets/SetSyncPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Using BrowserRouter instead of HashRouter for better SEO and AdSense compliance */}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/products" element={<Products />} />
              <Route path="/news" element={<News />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Sets routes */}
              <Route path="/sets" element={<Sets />} />
              <Route path="/sets/pokemon" element={<PokemonSets />} />
              <Route path="/sets/pokemon/:setId" element={<PokemonSetDetails />} />
              <Route path="/sets/mtg" element={<MTGSets />} />
              <Route path="/sets/yugioh" element={<YugiohSets />} />
              <Route path="/sets/lorcana" element={<LorcanaSets />} />
              <Route 
                path="/sets/sync" 
                element={
                  <RequireAdmin>
                    <SetSyncPage />
                  </RequireAdmin>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/articles" 
                element={
                  <RequireAdmin>
                    <AdminArticles />
                  </RequireAdmin>
                } 
              />
              <Route 
                path="/admin/articles/new" 
                element={
                  <RequireAdmin>
                    <ArticleEditor />
                  </RequireAdmin>
                } 
              />
              <Route 
                path="/admin/articles/edit/:id" 
                element={
                  <RequireAdmin>
                    <ArticleEditor />
                  </RequireAdmin>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
