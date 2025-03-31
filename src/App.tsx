
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PageCacheWrapper from "./components/cache/PageCacheWrapper";
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
import ManageTCGReleases from "./pages/admin/ManageTCGReleases";
import ManageModels from "./pages/admin/ManageModels";
import ManageProducts from "./pages/admin/ManageProducts";
import UserManagement from "./pages/admin/UserManagement";
import PSAMarket from "./pages/PSAMarket";
import PSACardDetails from "./pages/PSACardDetails";
import ManageMarket from "./pages/admin/ManageMarket";
import SupportMessages from "./pages/admin/SupportMessages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
      gcTime: 30 * 60 * 1000,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<PageCacheWrapper><Index /></PageCacheWrapper>} />
              <Route path="/about" element={<PageCacheWrapper><About /></PageCacheWrapper>} />
              <Route path="/contact" element={<PageCacheWrapper><Contact /></PageCacheWrapper>} />
              <Route path="/products" element={<PageCacheWrapper><Products /></PageCacheWrapper>} />
              <Route path="/news" element={<PageCacheWrapper><News /></PageCacheWrapper>} />
              <Route path="/market" element={<PageCacheWrapper><PSAMarket /></PageCacheWrapper>} />
              <Route path="/psa-market" element={<PageCacheWrapper><PSAMarket /></PageCacheWrapper>} />
              <Route path="/psa-market/:id" element={<PageCacheWrapper><PSACardDetails /></PageCacheWrapper>} />
              <Route path="/psa-card/:id" element={<PageCacheWrapper><PSACardDetails /></PageCacheWrapper>} />
              <Route path="/article/:id" element={<PageCacheWrapper><ArticleDetails /></PageCacheWrapper>} />
              <Route path="/privacy" element={<PageCacheWrapper><PrivacyPolicy /></PageCacheWrapper>} />
              <Route path="/terms" element={<PageCacheWrapper><TermsOfService /></PageCacheWrapper>} />
              <Route path="/cookies" element={<PageCacheWrapper><CookiePolicy /></PageCacheWrapper>} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <RequireAuth>
                    <PageCacheWrapper><Dashboard /></PageCacheWrapper>
                  </RequireAuth>
                } 
              />
              
              <Route path="/sets" element={<PageCacheWrapper><Sets /></PageCacheWrapper>} />
              <Route path="/sets/pokemon" element={<PageCacheWrapper><PokemonSets /></PageCacheWrapper>} />
              <Route path="/sets/pokemon/:setId" element={<PageCacheWrapper><PokemonSetDetails /></PageCacheWrapper>} />
              
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
                path="/admin/tcg-releases" 
                element={
                  <RequireAdmin>
                    <ManageTCGReleases />
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
                path="/admin/users" 
                element={
                  <RequireAdmin>
                    <UserManagement />
                  </RequireAdmin>
                } 
              />
              
              <Route path="/admin/psa-market" element={<PSAMarket />} />
              
              <Route 
                path="/admin/manage-market" 
                element={
                  <RequireAdmin>
                    <ManageMarket />
                  </RequireAdmin>
                } 
              />
              
              <Route 
                path="/admin/models" 
                element={
                  <RequireAdmin>
                    <ManageModels />
                  </RequireAdmin>
                } 
              />
              
              <Route 
                path="/admin/support" 
                element={
                  <RequireAdmin>
                    <SupportMessages />
                  </RequireAdmin>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
