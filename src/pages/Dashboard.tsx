import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Dashboard = () => {
  const { currentUser, userData, loading, getUserOpenRouterApiKey } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  const handleGetApiKey = async () => {
    setIsLoadingKey(true);
    try {
      const key = await getUserOpenRouterApiKey();
      setApiKey(key);
      
      // If we're in the Chrome extension context, send the key back to the extension
      if (window.opener && window.location.search.includes('source=extension')) {
        window.opener.postMessage({ 
          type: 'OPENROUTER_API_KEY', 
          payload: { key } 
        }, '*');
        // Close the popup after sending the key
        window.close();
      }
    } catch (error) {
      console.error('Error retrieving API key:', error);
    } finally {
      setIsLoadingKey(false);
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
      
      <div className="container mx-auto px-4 py-8">
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
                  <p className="capitalize">{userData?.subscription?.status || 'No active subscription'}</p>
                </div>
                {userData?.subscription?.status === 'active' && (
                  <div>
                    <p className="text-sm text-gray-400">Subscription Plan</p>
                    <p className="capitalize">{userData?.subscription?.plan}</p>
                  </div>
                )}
                {userData?.subscription?.expiresAt && (
                  <div>
                    <p className="text-sm text-gray-400">Renews On</p>
                    <p>{formatDate(userData.subscription.expiresAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader>
              <CardTitle>API Credits</CardTitle>
              <CardDescription className="text-gray-400">
                Your available OpenRouter API credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-gray-400">Available Credits</p>
                    <p className="text-sm font-medium">{userData?.credits || 0}</p>
                  </div>
                  <Progress value={userData?.credits ? Math.min(userData.credits / 1000 * 100, 100) : 0} className="h-2" />
                </div>
                
                {userData?.openRouterKeyHash ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">API Key Status</p>
                      <p className="text-green-500">Active</p>
                    </div>
                    
                    <Button 
                      onClick={handleGetApiKey} 
                      disabled={isLoadingKey}
                      className="w-full"
                    >
                      {isLoadingKey ? "Loading..." : "Show API Key"}
                    </Button>
                    
                    {apiKey && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Your API Key</p>
                        <div className="bg-gray-900 p-3 rounded-md overflow-x-auto">
                          <code className="text-sm break-all">{apiKey}</code>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Keep this key secure. Do not share it publicly.
                        </p>
                      </div>
                    )}
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
                
                <div className="bg-gray-900 p-4 rounded-md mt-4">
                  <p className="text-sm text-gray-400 mb-2">Need to purchase more credits?</p>
                  <Button onClick={() => navigate('/pricing')}>
                    View Pricing Plans
                  </Button>
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


