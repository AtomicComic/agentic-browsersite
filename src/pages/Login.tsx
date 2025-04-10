import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmailAndPassword, signInWithGoogle } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailLinkSignIn from '@/components/EmailLinkSignIn';
import { getUserOpenRouterKey } from '@/lib/firebase-functions';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, userData, loading } = useAuth();

  // Check if login is from Chrome extension - this needs to be checked on every render
  // to ensure it's properly detected even when the user is already logged in
  const [isFromExtension, setIsFromExtension] = useState(false);
  const [extensionId, setExtensionId] = useState<string | null>(null);

  // Use an effect to check URL parameters after component mount
  // This ensures parameters are properly detected even with direct navigation
  useEffect(() => {
    // Force this to run after the component is fully mounted
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasExtensionParam = urlParams.has('source') && urlParams.get('source') === 'extension';
      const extId = urlParams.get('extensionId');

      console.log('Checking URL params:', {
        search: window.location.search,
        hasExtensionParam,
        extId
      });

      setIsFromExtension(hasExtensionParam);
      setExtensionId(extId);
    };

    // Run immediately and also after a short delay to ensure parameters are captured
    checkUrlParams();
    const timeoutId = setTimeout(checkUrlParams, 100);

    return () => clearTimeout(timeoutId);
  }, [window.location.search]);

  // Function to send auth data to extension
  const sendAuthDataToExtension = async () => {
    console.log('Attempting to send auth data to extension...');
    try {
      // Get the user's OpenRouter API key
      console.log('Fetching OpenRouter API key...');
      const apiKey = await getUserOpenRouterKey();
      if (!apiKey) {
        console.error('Failed to retrieve API key');
        return false;
      }
      console.log('Successfully retrieved API key');

      // Get user info
      const userInfo = {
        email: currentUser?.email,
        uid: currentUser?.uid,
        displayName: currentUser?.displayName
      };

      // Get credits and subscription info
      const credits = userData?.credits || 0;
      const subscription = userData?.subscription || {
        status: 'inactive',
        plan: null,
        expiresAt: null
      };

      // Send data to extension using chrome.runtime.sendMessage
      if (extensionId) {
        console.log('Preparing to send data to extension ID:', extensionId);
        try {
          // @ts-ignore - Chrome API not in TypeScript defs
          chrome.runtime.sendMessage(
            extensionId,
            {
              type: 'OPENROUTER_API_KEY',
              payload: {
                key: apiKey,
                userInfo,
                credits,
                subscription
              }
            },
            // Add a callback to check if the message was sent successfully
            // @ts-ignore - Chrome API not in TypeScript defs
            (response: any) => {
              console.log('Extension response:', response);
              // @ts-ignore - Chrome API not in TypeScript defs
              if (chrome.runtime.lastError) {
                // @ts-ignore - Chrome API not in TypeScript defs
                console.error('Error sending message to extension:', chrome.runtime.lastError);
              }
            }
          );

          console.log('Sent auth data to extension:', extensionId);
          return true;
        } catch (err) {
          console.error('Exception when sending message to extension:', err);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error sending auth data to extension:', error);
      return false;
    }
  };

  // Use useEffect for navigation to avoid React state update issues
  React.useEffect(() => {
    console.log('Login component mounted');
    console.log('Auth state:', { currentUser, loading });
    console.log('Extension params:', { isFromExtension, extensionId });

    if (!loading && currentUser) {
      console.log('User is logged in');

      // If login is from extension, send auth data and close window
      if (isFromExtension) {
        console.log('Login is from extension, checking extensionId:', extensionId);
        if (extensionId) {
          console.log('Extension ID found, sending auth data...');
          sendAuthDataToExtension().then(success => {
            console.log('Auth data send result:', success);
            if (success) {
              // Show success message briefly before closing
              toast({
                title: "Authentication Successful",
                description: "You can now close this window and return to the extension."
              });

              // Close the window after a short delay
              setTimeout(() => {
                window.close();
              }, 2000);
            } else {
              // If sending auth data failed, redirect to dashboard
              console.log('Failed to send auth data, redirecting to dashboard');
              navigate('/dashboard');
            }
          });
        } else {
          console.log('No extension ID found, redirecting to dashboard');
          navigate('/dashboard');
        }
      } else {
        // Normal login flow - redirect to dashboard
        console.log('Normal login flow, navigating to dashboard');
        navigate('/dashboard');
      }
    }
  }, [currentUser, loading, navigate, isFromExtension, extensionId, sendAuthDataToExtension, toast]);
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Attempting login with:", email); // Debug log
      await loginWithEmailAndPassword(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error); // Debug log
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0A0C14] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Sign in to access your account and API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="email-link">Email Link</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email-link" className="space-y-4">
              <EmailLinkSignIn isLoading={isLoading} setIsLoading={setIsLoading} />
              <p className="text-xs text-center text-muted-foreground mt-2">
                We'll send you a magic link to sign in without a password
              </p>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </div>
          {isFromExtension && (
            <div className="text-xs text-gray-400 mt-4">
              You're signing in from the Chrome extension. After login, you'll be redirected back to the extension.
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
