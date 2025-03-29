
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
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showEncryptionMessage, setShowEncryptionMessage] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetInProgress, setResetInProgress] = useState(false);
  const { user, signIn, signUp, signInWithGoogle, sendPasswordResetEmail } = useAuth();
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

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError(null);
    setResetInProgress(true);
    
    try {
      await sendPasswordResetEmail(email);
      setResetEmailSent(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email');
    } finally {
      setResetInProgress(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    
    try {
      await signInWithGoogle();
      // Redirect is handled by Supabase, and then by the useEffect when user state updates
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      setIsGoogleSubmitting(false);
    }
  };

  const GoogleButton = () => (
    <Button 
      type="button" 
      variant="outline" 
      className="w-full flex items-center justify-center space-x-2"
      onClick={handleGoogleSignIn}
      disabled={false}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
      </svg>
      <span>Sign in with Google</span>
    </Button>
  );

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
            ) : resetEmailSent ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">
                    Password reset instructions have been sent to your email address. Please check your inbox.
                  </AlertDescription>
                </Alert>
                <Button 
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setResetEmailSent(false);
                    setEmail('');
                  }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <div className="pt-4 pb-2">
                    <GoogleButton />
                  </div>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSignIn}>
                    <div className="space-y-4">
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
                      
                      <div className="flex flex-col space-y-2">
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
                        
                        <Button 
                          variant="link" 
                          className="self-end text-sm text-gray-500 hover:text-gray-800"
                          onClick={handleForgotPassword}
                          disabled={resetInProgress}
                        >
                          {resetInProgress ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Sending...
                            </>
                          ) : "Forgot password?"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <div className="pt-4 pb-2">
                    <GoogleButton />
                  </div>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSignUp}>
                    <div className="space-y-4">
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
            {!showEncryptionMessage && !resetEmailSent && (
              <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Auth;
