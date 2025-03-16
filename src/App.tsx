
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { Toaster } from "@/components/ui/sonner";
import Index from '@/pages/Index';
import About from '@/pages/About';
import Products from '@/pages/Products';
import Contact from '@/pages/Contact';
import NotFound from '@/pages/NotFound';
import Sets from '@/pages/Sets';
import PokemonSets from '@/pages/TCGSets/PokemonSets';
import MTGSets from '@/pages/TCGSets/MTGSets';
import YugiohSets from '@/pages/TCGSets/YugiohSets';
import LorcanaSets from '@/pages/TCGSets/LorcanaSets';
import PokemonSetDetails from '@/pages/TCGSets/PokemonSetDetails';
import SetSyncPage from '@/pages/TCGSets/SetSyncPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import CookiePolicy from '@/pages/CookiePolicy';
import News from '@/pages/News';
import RequireAuth from '@/components/auth/RequireAuth';
import RequireAdmin from '@/components/auth/RequireAdmin';
import Auth from '@/pages/Auth';
import ArticleDetails from '@/pages/ArticleDetails';
import AdminArticles from '@/pages/admin/AdminArticles';
import ManageRecentReleases from '@/pages/admin/ManageRecentReleases';
import ManageUpcomingReleases from '@/pages/admin/ManageUpcomingReleases';
import { AuthProvider } from '@/contexts/AuthContext';
import { useMetaTags } from '@/hooks/use-meta-tags';

function App() {
  useMetaTags({
    title: "TCG In-Stock Tracker",
    description: "Track in-stock status for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, and Disney Lorcana cards across major retailers."
  });
  
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/news" element={<News />} />
        <Route path="/article/:id" element={<ArticleDetails />} />
        
        <Route path="/sets" element={<Sets />} />
        <Route path="/sets/pokemon" element={<PokemonSets />} />
        <Route path="/sets/pokemon/:setId" element={<PokemonSetDetails />} />
        <Route path="/sets/mtg" element={<MTGSets />} />
        <Route path="/sets/yugioh" element={<YugiohSets />} />
        <Route path="/sets/lorcana" element={<LorcanaSets />} />
        
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin/sync-sets" 
          element={
            <RequireAuth>
              <RequireAdmin>
                <SetSyncPage />
              </RequireAdmin>
            </RequireAuth>
          } 
        />
        <Route 
          path="/admin/articles" 
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminArticles />
              </RequireAdmin>
            </RequireAuth>
          } 
        />
        <Route 
          path="/admin/articles/new" 
          element={
            <RequireAuth>
              <RequireAdmin>
                <div>ArticleEditor</div>
              </RequireAdmin>
            </RequireAuth>
          } 
        />
        <Route 
          path="/admin/articles/edit/:id" 
          element={
            <RequireAuth>
              <RequireAdmin>
                <div>ArticleEditor</div>
              </RequireAdmin>
            </RequireAuth>
          } 
        />
        <Route
          path="/admin/recent-releases"
          element={
            <RequireAuth>
              <RequireAdmin>
                <ManageRecentReleases />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/upcoming-releases"
          element={
            <RequireAuth>
              <RequireAdmin>
                <ManageUpcomingReleases />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
