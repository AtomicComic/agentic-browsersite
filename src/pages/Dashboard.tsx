import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Progress component no longer needed
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
// No need to import OpenRouterCreditInfo as we're using it from the auth context

const Dashboard = () => {
  const { currentUser, userData, loading, openRouterCredits, refreshOpenRouterCredits, getUserOpenRouterApiKey } = useAuth();
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);
  const [lastCreditRefresh, setLastCreditRefresh] = useState<Date | null>(null);
  const navigate = useNavigate();

  // Check if dashboard is opened from Chrome extension
  const [isFromExtension, setIsFromExtension] = useState(false);
  const [extensionId, setExtensionId] = useState<string | null>(null);

  // Function to refresh OpenRouter credits with loading state
  const handleRefreshCredits = async () => {
    setIsRefreshingCredits(true);
    try {
      await refreshOpenRouterCredits();
      setLastCreditRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing OpenRouter credits:', error);
    } finally {
      setIsRefreshingCredits(false);
    }
  };

  // Set last refresh time when credits are updated
  useEffect(() => {
    if (openRouterCredits && !lastCreditRefresh) {
      setLastCreditRefresh(new Date());
    }
  }, [openRouterCredits, lastCreditRefresh]);

  // Use an effect to check URL parameters after component mount
  useEffect(() => {
    // Check for extension parameters
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasExtensionParam = urlParams.has('source') && urlParams.get('source') === 'extension';
      const extId = urlParams.get('extensionId');

      console.log('Dashboard - Checking URL params:', {
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

  // Handle authentication and redirection
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    } else if (!loading && currentUser && isFromExtension && extensionId) {
      // If user is logged in and coming from extension, automatically get API key
      console.log('User is logged in and coming from extension, getting API key...');
      handleGetApiKey();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, loading, navigate, isFromExtension, extensionId]);



  const handleGetApiKey = async () => {
    try {
      // Refresh credits to ensure we have the latest data
      await handleRefreshCredits();

      // If we're in the Chrome extension context, send the key back to the extension
      if (isFromExtension) {
        console.log('Sending API key to extension...');

        // Get the API key
        const apiKeyResult = await getUserOpenRouterApiKey();
        if (!apiKeyResult) {
          console.error('Failed to get API key for extension');
          return;
        }

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

        // Method 1: Try chrome.runtime.sendMessage if extensionId is available
        if (extensionId) {
          try {
            console.log('Sending API key via chrome.runtime.sendMessage to:', extensionId);
            // @ts-ignore - Chrome API not in TypeScript defs
            chrome.runtime.sendMessage(
              extensionId,
              {
                type: 'OPENROUTER_API_KEY',
                payload: {
                  key: apiKeyResult.apiKey,
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

            // Close the window after a short delay
            setTimeout(() => {
              window.close();
            }, 2000);

            return;
          } catch (err) {
            console.error('Exception when sending message to extension:', err);
            // Fall back to window.postMessage
          }
        }

        // Method 2: Fallback to window.postMessage
        if (window.opener) {
          console.log('Sending API key via window.postMessage');
          window.opener.postMessage({
            type: 'OPENROUTER_API_KEY',
            payload: {
              key: apiKeyResult.apiKey,
              userInfo,
              credits,
              subscription
            }
          }, '*');

          // Close the window after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error retrieving API key:', error);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0C14] text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C14] text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader>
              <CardTitle>Your Account</CardTitle>
              <CardDescription className="text-gray-400">
                Account details and subscription status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p>{currentUser?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Subscription Status</p>
                  {userData?.subscription?.status === 'canceled' ? (
                    <p className="text-yellow-500">Canceled (active until period end)</p>
                  ) : (
                    <p className="capitalize">{userData?.subscription?.status || 'No active subscription'}</p>
                  )}
                </div>
                {(userData?.subscription?.status === 'active' || userData?.subscription?.status === 'canceled') && (
                  <div>
                    <p className="text-sm text-gray-400">Subscription Plan</p>
                    <p className="capitalize">{userData?.subscription?.plan}</p>
                  </div>
                )}
                {userData?.subscription?.expiresAt && (
                  <div>
                    <p className="text-sm text-gray-400">
                      {userData?.subscription?.status === 'canceled' ? 'Active Until' : 'Renews On'}
                    </p>
                    <p>{formatDate(userData.subscription.expiresAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>API Credits</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your available OpenRouter API credits
                  </CardDescription>
                </div>
                {userData?.openRouterKeyHash && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleRefreshCredits}
                          disabled={isRefreshingCredits}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${isRefreshingCredits ? 'animate-spin' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh OpenRouter credits</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {openRouterCredits && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-gray-400">OpenRouter Credits Balance</p>
                      <p className="text-sm font-medium">
                        {openRouterCredits.credits.remaining !== null
                          ? `${openRouterCredits.credits.remaining.toFixed(2)}`
                          : 'Unlimited'}
                      </p>
                    </div>
                    {/* We're not showing the progress bar since we're only displaying the balance */}
                    {lastCreditRefresh && (
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        Last updated: {lastCreditRefresh.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}

                {userData?.openRouterKeyHash ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">API Key Status</p>
                      <p className="text-green-500">Active</p>
                    </div>

                    <Button
                      onClick={refreshOpenRouterCredits}
                      disabled={isRefreshingCredits}
                      className="w-full"
                    >
                      {isRefreshingCredits ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Refreshing...
                        </>
                      ) : (
                        "Refresh OpenRouter Credits"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2 p-4">
                    <p className="text-gray-400">You don't have an active API key yet</p>
                    <Button onClick={() => navigate('/pricing')}>
                      Purchase Credits
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status Card */}
        <div className="mt-8">
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription className="text-gray-400">
                Your current subscription plan and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Current Plan</p>
                    <p className="text-lg font-medium">
                      {userData?.subscription?.plan
                        ? userData.subscription.plan.charAt(0).toUpperCase() + userData.subscription.plan.slice(1)
                        : "No Active Plan"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Status</p>
                    <div className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${userData?.subscription?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <p className="font-medium">
                        {userData?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>

                {userData?.subscription?.expiresAt && userData.subscription.status === 'active' && (
                  <p className="text-sm text-gray-400">
                    Renews on {formatDate(userData.subscription.expiresAt)}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full"
                    size="lg"
                  >
                    {userData?.subscription?.status === 'active' ? 'Manage Subscription' : 'Get a Subscription'}
                  </Button>
                  <Button
                    onClick={() => navigate('/pricing')}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-700 w-full"
                  >
                    Buy More Credits
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Usage Card */}
        <div className="mt-8">
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription className="text-gray-400">
                How to use your API key with the Chrome extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Install the Agentic Browser Chrome extension</li>
                  <li>Click on the extension icon in your browser toolbar</li>
                  <li>Click "Sign In" and log in with your account</li>
                  <li>Your API key will be automatically configured for use</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;


