import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { functionsNew } from '@/lib/firebase-config'; // Import the specific functions instance for 'functionsnew' codebase
import { httpsCallable } from 'firebase/functions'; // Keep httpsCallable import
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Pricing options
const subscriptionPlans = [
  {
    id: 'monthly-basic',
    name: 'Basic',
    price: 8.99,
    interval: 'month',
    credits: 1000,
    openRouterCredit: 300, // Actual OpenRouter credit allocation (1000/3.33)
    features: [
      '1000 credits per month',
      'Credits reset monthly',
      'Access to all models',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'monthly-pro',
    name: 'Professional',
    price: 14.99,
    interval: 'month',
    credits: 2000,
    openRouterCredit: 600, // Actual OpenRouter credit allocation (2000/3.33)
    features: [
      '2000 credits per month',
      'Credits reset monthly',
      'Access to all models including GPT-4',
      'Priority email support',
      'Usage analytics',
    ],
    popular: true,
  },
  {
    id: 'monthly-enterprise',
    name: 'Enterprise',
    price: 24.99,
    interval: 'month',
    credits: 3000,
    openRouterCredit: 900, // Actual OpenRouter credit allocation (3000/3.33)
    features: [
      '3000 credits per month',
      'Credits reset monthly',
      'Access to all models including GPT-4',
      'Priority email support',
      'Advanced usage analytics',
      'Team member access',
    ],
    popular: false,
  },
];

const oneTimePlans = [
  {
    id: 'credits-1500',
    name: '1500 Credits',
    price: 14.99,
    credits: 1500,
    openRouterCredit: 450, // Actual OpenRouter credit allocation (1500/3.33)
    features: [
      '1500 total credits',
      'Credits never expire',
      'Access to all models',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'credits-6000',
    name: '6000 Credits',
    price: 49.99,
    credits: 6000,
    openRouterCredit: 1800, // Actual OpenRouter credit allocation (6000/3.33)
    features: [
      '6000 total credits',
      'Credits never expire',
      'Access to all models including GPT-4',
      'Email support',
      'Usage analytics',
    ],
    popular: true,
  },
  {
    id: 'credits-15000',
    name: '15000 Credits',
    price: 99.99,
    credits: 15000,
    openRouterCredit: 4500, // Actual OpenRouter credit allocation (15000/3.33)
    features: [
      '15000 total credits',
      'Credits never expire',
      'Access to all models including GPT-4',
      'Priority email support',
      'Advanced usage analytics',
    ],
    popular: false,
  },
];

const Pricing = () => {
  const [selectedTab, setSelectedTab] = useState('subscription');
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user isn't logged in, redirect to login
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  const handlePurchase = async (planId: string, isSubscription: boolean) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      console.log('Starting checkout process for plan:', planId, 'isSubscription:', isSubscription);

      // Firebase functions instance is already initialized and connected to emulator in firebase-config.ts
          // We just need the httpsCallable function itself

          // Create a callable function reference using the imported 'functionsNew' instance
          const createCheckoutSessionCallable = httpsCallable(functionsNew, 'createCheckoutSession');

          // Prepare the request data
      const requestData = {
        planId,
        isSubscription,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=canceled`,
      };

      console.log('Calling createCheckoutSession callable with data:', requestData);

      // Call the function
      const result = await createCheckoutSessionCallable(requestData);

      console.log('Received result from createCheckoutSession:', result);

      // The result data will contain the URL from your function
      const { url } = result.data as { url: string };

      if (!url) {
        console.error('No URL returned from checkout session');
        return;
      }

      console.log('Redirecting to Stripe checkout URL:', url);

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // You could add a toast notification or alert here
    }
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

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">Pricing Plans</h1>
          <p className="mt-4 text-xl text-gray-400">
            Choose the plan that works best for you
          </p>
        </div>

        <Tabs
          defaultValue="subscription"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full max-w-3xl mx-auto"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="subscription">Monthly Subscription</TabsTrigger>
            <TabsTrigger value="one-time">One-time Purchase</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`border ${plan.popular ? 'border-blue-500' : 'border-gray-700'} bg-gray-800`}
                >
                  <CardHeader>
                    {plan.popular && (
                      <Badge className="w-fit mb-2 bg-blue-500 hover:bg-blue-600">
                        Most Popular
                      </Badge>
                    )}
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-400">/{plan.interval}</span>
                    </div>
                    <p className="text-blue-400 font-medium mt-2">
                      {plan.credits} credits per month
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                      onClick={() => handlePurchase(plan.id, true)}
                    >
                      Subscribe
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="one-time">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {oneTimePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`border ${plan.popular ? 'border-blue-500' : 'border-gray-700'} bg-gray-800`}
                >
                  <CardHeader>
                    {plan.popular && (
                      <Badge className="w-fit mb-2 bg-blue-500 hover:bg-blue-600">
                        Most Popular
                      </Badge>
                    )}
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-400"> one-time</span>
                    </div>
                    <p className="text-blue-400 font-medium mt-2">
                      {plan.credits} total credits
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                      onClick={() => handlePurchase(plan.id, false)}
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center text-gray-400 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-white mb-4">How Credits Work</h3>
          <p className="mb-4">
            Subscription credits reset at the beginning of each billing cycle. One-time purchase credits never expire and are added to your account balance.
          </p>
          <p>
            Different models consume different amounts of credits. Basic models like GPT-3.5 use 1 credit per request, while advanced models like GPT-4 may use 5-10 credits per request depending on complexity.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
