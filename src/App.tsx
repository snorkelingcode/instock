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
import ArticleDetails from "./pages/ArticleDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService"; 
import CookiePolicy from "./pages/CookiePolicy";
import Sets from "./pages/Sets";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import ArticleEditor from "./components/admin/ArticleEditor";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import PokemonSets from "./pages/TCGSets/PokemonSets";
import PokemonSetDetails from "./pages/TCGSets/PokemonSetDetails";
import SetSyncPage from "./pages/TCGSets/SetSyncPage";
import ManagePokemonReleases from "./pages/admin/ManagePokemonReleases";
import Forge from "./pages/Forge";
import ManageModels from "./pages/admin/ManageModels";
import ManageProducts from "./pages/admin/ManageProducts";
import InStockMonitor from "./pages/admin/InStockMonitor";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/products" element={<Products />} />
              <Route path="/news" element={<News />} />
              <Route path="/article/:id" element={<ArticleDetails />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                } 
              />
              
              <Route path="/sets" element={<Sets />} />
              <Route path="/sets/pokemon" element={<PokemonSets />} />
              <Route path="/sets/pokemon/:setId" element={<PokemonSetDetails />} />
              
              <Route 
                path="/sets/sync" 
                element={
                  <RequireAdmin>
                    <SetSyncPage />
                  </RequireAdmin>
                } 
              />
              
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
              
              <Route 
                path="/admin/pokemon-releases" 
                element={
                  <RequireAdmin>
                    <ManagePokemonReleases />
                  </RequireAdmin>
                } 
              />
              
              <Route 
                path="/admin/products" 
                element={
                  <RequireAdmin>
                    <ManageProducts />
                  </RequireAdmin>
                } 
              />
              
              <Route 
                path="/admin/stock-monitor" 
                element={
                  <RequireAdmin>
                    <InStockMonitor />
                  </RequireAdmin>
                } 
              />
              
              <Route path="/forge" element={<Forge />} />
              
              <Route 
                path="/admin/models" 
                element={
                  <RequireAdmin>
                    <ManageModels />
                  </RequireAdmin>
                } 
              />
              
              <Route path="/profile" element={<UserProfile />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
