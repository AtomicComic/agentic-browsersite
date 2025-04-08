import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSignInWithEmailLink } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';

const EmailSignIn = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a sign-in link
    const isSignInLink = isSignInWithEmailLink(auth, window.location.href);
    
    if (!isSignInLink) {
      setError('Invalid sign-in link. Please request a new link.');
      return;
    }

    // Try to get the email from localStorage
    const savedEmail = window.localStorage.getItem('emailForSignIn');
    
    if (savedEmail) {
      setEmail(savedEmail);
      handleSignIn(savedEmail);
    } else {
      // If we don't have the email, we need to ask the user
      setNeedsEmail(true);
    }
  }, []);

  const handleSignIn = async (emailToUse: string) => {
    try {
      setIsLoading(true);
      await completeSignInWithEmailLink(emailToUse, window.location.href);
      
      toast({
        title: "Sign-in Successful",
        description: "You are now signed in.",
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Error signing in with email link:", error);
      
      setError(error.message || "Failed to sign in. Please try again.");
      
      toast({
        title: "Sign-in Failed",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
      
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    handleSignIn(email);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0A0C14] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Email Sign-in</CardTitle>
          <CardDescription>
            Complete your sign-in process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <h3 className="font-medium text-red-600 dark:text-red-400">Error</h3>
              <p className="text-sm mt-2">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          ) : needsEmail ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  Please confirm your email address to complete the sign-in process.
                </p>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Complete Sign-in"}
              </Button>
            </form>
          ) : (
            <div className="text-center p-4">
              <p className="text-sm">Completing sign-in process...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSignIn;
