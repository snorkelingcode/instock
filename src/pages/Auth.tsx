
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/loading-spinner';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEncryptionMessage, setShowEncryptionMessage] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      await signIn(email, password);
      // Redirect is handled by the useEffect when user state updates
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setShowEncryptionMessage(true);
    
    try {
      // Add a slight delay to show the encryption message
      timeoutRef.current = window.setTimeout(async () => {
        try {
          await signUp(email, password);
          // The redirect will happen via useEffect when user state updates
        } catch (error: any) {
          setError(error.message || 'Failed to sign up');
          setIsSubmitting(false);
          setShowEncryptionMessage(false);
        }
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
      setIsSubmitting(false);
      setShowEncryptionMessage(false);
    }
  };

  return (
    <Layout>
      <div className="container flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to TCG Updates</CardTitle>
            <CardDescription>Sign in or create an account to join our community</CardDescription>
          </CardHeader>
          <CardContent>
            {showEncryptionMessage ? (
              <div className="flex flex-col items-center justify-center py-8">
                <LoadingSpinner size="lg" color="blue" showText text="Encrypting your data..." />
                <p className="mt-4 text-sm text-gray-500">
                  Your password is being securely encrypted before storage
                </p>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn}>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      {error && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Signing in...
                          </>
                        ) : "Sign In"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp}>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          type="password"
                          placeholder="Password (min 6 characters)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                      </div>
                      
                      {error && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Creating account...
                          </>
                        ) : "Create Account"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            {!showEncryptionMessage && (
              <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Auth;
