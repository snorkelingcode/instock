
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import PokemonSets from "./pages/TCGSets/PokemonSets";
import MTGSets from "./pages/TCGSets/MTGSets";
import YugiohSets from "./pages/TCGSets/YugiohSets";
import LorcanaSets from "./pages/TCGSets/LorcanaSets";
import SetSyncPage from "./pages/TCGSets/SetSyncPage";
import PokemonSetDetails from "./pages/TCGSets/PokemonSetDetails";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
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
            
            {/* TCG Sets routes */}
            <Route path="/sets" element={<Sets />} />
            <Route path="/sets/pokemon" element={<PokemonSets />} />
            <Route path="/sets/pokemon/:setId" element={<PokemonSetDetails />} />
            <Route path="/sets/mtg" element={<MTGSets />} />
            <Route path="/sets/yugioh" element={<YugiohSets />} />
            <Route path="/sets/lorcana" element={<LorcanaSets />} />
            <Route path="/sets/sync" element={<SetSyncPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
