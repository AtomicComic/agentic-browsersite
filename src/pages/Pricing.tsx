import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { createCheckoutSession } from '@/lib/firebase-functions';
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
    features: [
      '3000 credits per month',
      'Credits reset monthly',
      'Access to all models including GPT-4',
      'Priority email support',
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
  const { currentUser, loading } = useAuth();
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

      // Prepare the URLs for success and cancel
      const successUrl = `${window.location.origin}/dashboard?checkout=success`;
      const cancelUrl = `${window.location.origin}/pricing?checkout=canceled`;

      // Call our Firebase function client
      const checkoutUrl = await createCheckoutSession(
        planId,
        isSubscription,
        successUrl,
        cancelUrl
      );

      console.log('Redirecting to Stripe checkout URL:', checkoutUrl);

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
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

      <div className="container mx-auto px-4 py-16 mt-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">Pricing Plans</h1>
          <p className="mt-4 text-xl text-white">
            Choose the plan that works best for you
          </p>
        </div>

        <Tabs
          defaultValue="subscription"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full max-w-3xl mx-auto"
        >
          <TabsList className="grid w-full grid-cols-2 mb-10 bg-gray-800 p-1 rounded-xl border border-gray-700">
            <TabsTrigger value="subscription">Monthly Subscription</TabsTrigger>
            <TabsTrigger value="one-time">One-time Purchase</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`border ${plan.popular ? 'border-[#66B3FF] shadow-lg shadow-[#66B3FF]/20' : 'border-gray-600'} bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl hover:translate-y-[-4px] transition-all duration-300`}
                >
                  <CardHeader>
                    {plan.popular && (
                      <Badge className="w-fit mb-2 bg-[#66B3FF] hover:bg-[#66B3FF]/90">
                        Most Popular
                      </Badge>
                    )}
                    <CardTitle className="text-white text-2xl font-bold mb-2">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-white opacity-80">/{plan.interval}</span>
                    </div>

                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                          <span className="text-white">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full font-medium py-6 text-white ${plan.popular
                        ? 'bg-[#66B3FF] hover:bg-[#66B3FF]/90 shadow-md shadow-[#66B3FF]/20'
                        : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'}`}
                      onClick={() => handlePurchase(plan.id, true)}
                    >
                      Subscribe Now
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
                  className={`border ${plan.popular ? 'border-[#66B3FF] shadow-lg shadow-[#66B3FF]/20' : 'border-gray-600'} bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl hover:translate-y-[-4px] transition-all duration-300`}
                >
                  <CardHeader>
                    {plan.popular && (
                      <Badge className="w-fit mb-2 bg-[#66B3FF] hover:bg-[#66B3FF]/90">
                        Most Popular
                      </Badge>
                    )}
                    <CardTitle className="text-white text-2xl font-bold mb-2">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-white opacity-80"> one-time</span>
                    </div>

                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                          <span className="text-white">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full font-medium py-6 text-white ${plan.popular
                        ? 'bg-[#66B3FF] hover:bg-[#66B3FF]/90 shadow-md shadow-[#66B3FF]/20'
                        : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'}`}
                      onClick={() => handlePurchase(plan.id, false)}
                    >
                      Purchase Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 text-center max-w-2xl mx-auto bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-600 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-6">How Credits Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold text-[#66B3FF] mb-3">Subscription Credits</h4>
              <p className="text-white">
                Reset at the beginning of each billing cycle. Use these first before one-time credits.
              </p>
            </div>
            <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold text-[#66B3FF] mb-3">One-Time Credits</h4>
              <p className="text-white">
                Never expire and are added to your account balance. Used after subscription credits.
              </p>
            </div>
          </div>
          <p className="text-white mt-6 pt-4 border-t border-gray-700">
            Different tasks will use different amounts of credits but generally, 1000 credits would get you around 1.5-2 hours of continuous usage. 
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
