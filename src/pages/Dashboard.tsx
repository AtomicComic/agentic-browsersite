import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Progress component no longer needed
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
// No need to import credit info as we're using it from the auth context

const Dashboard = () => {
  const { currentUser, userData, loading, openRouterCredits, refreshOpenRouterCredits, getUserOpenRouterApiKey } = useAuth();
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);
  const [lastCreditRefresh, setLastCreditRefresh] = useState<Date | null>(null);
  const navigate = useNavigate();

  // Check if dashboard is opened from Chrome extension
  const [isFromExtension, setIsFromExtension] = useState(false);
  const [extensionId, setExtensionId] = useState<string | null>(null);

  // Function to refresh Agentic Browser credits with loading state
  const handleRefreshCredits = async () => {
    setIsRefreshingCredits(true);
    try {
      await refreshOpenRouterCredits();
      setLastCreditRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing Agentic Browser credits:', error);
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
          <Card className="bg-gradient-to-b from-gray-800 to-gray-900 text-white border-gray-700 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-700 bg-gray-800/50">
              <CardTitle className="text-xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Your Account
              </CardTitle>
              <CardDescription className="text-gray-300">
                Account details and subscription status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-[#66B3FF] font-medium mb-1">Email Address</p>
                  <p className="text-white font-medium">{currentUser?.email}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-900/30 to-gray-800/80 p-5 rounded-lg border border-blue-800/50 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                        Subscription
                      </h3>
                      <p className="text-sm text-[#66B3FF] mt-1 font-medium">
                        {userData?.subscription?.plan
                          ? (userData.subscription.plan === 'monthly'
                              ? 'Basic Plan' // Display 'Basic Plan' for monthly subscriptions
                              : userData.subscription.plan === 'yearly'
                                ? 'Premium Plan' // Display 'Premium Plan' for yearly subscriptions
                                : userData.subscription.plan) // Fallback to the actual plan name
                          : "No Active Plan"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#66B3FF] mb-1 font-medium">Status</p>
                      <div className="flex items-center bg-gray-900/80 px-3 py-1 rounded-full border border-gray-700">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${userData?.subscription?.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <p className="font-medium text-white">
                          {userData?.subscription?.status === 'active' ? 'Active' :
                           userData?.subscription?.status === 'canceled' ? 'Canceled' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {userData?.subscription?.expiresAt && userData.subscription.status === 'active' && (
                    <div className="bg-gray-900/50 p-3 rounded-lg mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-white">
                        Renews on <span className="font-medium">{formatDate(userData.subscription.expiresAt)}</span>
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => navigate('/pricing')}
                    className="w-full py-5 font-medium text-sm bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
                  >
                    {userData?.subscription?.status === 'active' ? 'Manage Subscription' : 'Get a Subscription'}
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-gray-800 to-gray-900 text-white border-gray-700 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-700 bg-gray-800/50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    API Credits
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Your available Agentic Browser API credits
                  </CardDescription>
                </div>
                {userData?.openRouterKeyHash && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-full border border-gray-600 bg-gray-800 hover:bg-gray-700"
                          onClick={handleRefreshCredits}
                          disabled={isRefreshingCredits}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${isRefreshingCredits ? 'animate-spin text-blue-400' : 'text-white'}`}
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
                        <p>Refresh credits</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {openRouterCredits ? (
                  <div className="bg-gradient-to-r from-blue-900/30 to-gray-800/80 p-5 rounded-lg border border-blue-800/50 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          Agentic Browser Credits
                        </h3>
                        <div className="mt-3 flex items-center">
                          <div className="bg-gray-900/80 px-4 py-2 rounded-lg border border-gray-700 inline-flex items-center">
                            <p className="text-3xl font-bold text-[#66B3FF]">
                              {openRouterCredits.credits.remaining !== null
                                ? `${openRouterCredits.credits.remaining.toFixed(2)}`
                                : 'Unlimited'}
                            </p>
                            <span className="ml-2 text-gray-400 text-sm">credits remaining</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Button
                          onClick={handleRefreshCredits}
                          disabled={isRefreshingCredits}
                          className="bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center text-sm font-medium"
                        >
                          {isRefreshingCredits ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Refreshing
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Refresh
                            </>
                          )}
                        </Button>
                        {lastCreditRefresh && (
                          <p className="text-xs text-gray-400 mt-2">
                            Last updated: {lastCreditRefresh.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-900/30 to-gray-800/80 p-5 rounded-lg border border-blue-800/50 shadow-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          Agentic Browser Credits
                        </h3>
                        <div className="mt-3 flex items-center">
                          <div className="bg-gray-900/80 px-4 py-2 rounded-lg border border-gray-700 inline-flex items-center">
                            <div className="h-5 w-24 bg-gray-700 rounded animate-pulse"></div>
                            <span className="ml-2 text-gray-400 text-sm">Loading...</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleRefreshCredits}
                        disabled={isRefreshingCredits}
                        className="bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center text-sm font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Loading
                      </Button>
                    </div>
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
                      className="w-full bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-white py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-sm font-medium"
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
                        "Refresh Agentic Browser Credits"
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



        {/* Buy Credits Card */}
        <div className="mt-8">
          <Card className="bg-gradient-to-b from-gray-800 to-gray-900 text-white border-gray-700 border-2 border-[#66B3FF] shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-700 bg-gray-800/50">
              <CardTitle className="text-xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Buy More Credits
              </CardTitle>
              <CardDescription className="text-gray-300">
                Purchase additional credits for your Agentic Browser API usage
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-900/30 to-gray-800/80 p-5 rounded-lg border border-blue-800/50 shadow-md">
                  <p className="text-white">
                    Need more credits for your AI tasks? Purchase additional credits to continue using the Agentic Browser API.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/pricing')}
                  className="bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-white w-full py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                  size="lg"
                >
                  Buy Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Usage Card */}
        <div className="mt-8">
          <Card className="bg-gradient-to-b from-gray-800 to-gray-900 text-white border-gray-700 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-700 bg-gray-800/50">
              <CardTitle className="text-xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#66B3FF]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                API Usage
              </CardTitle>
              <CardDescription className="text-gray-300">
                How to use your API key with the Chrome extension
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-900/30 to-gray-800/80 p-5 rounded-lg border border-blue-800/50 shadow-md">
                  <ol className="list-decimal list-inside space-y-3 text-white">
                    <li>Install the Agentic Browser Chrome extension</li>
                    <li>Click on the extension icon in your browser toolbar</li>
                    <li>Click "Sign In" and log in with your account</li>
                    <li>Your API key will be automatically configured for use</li>
                  </ol>
                </div>
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


