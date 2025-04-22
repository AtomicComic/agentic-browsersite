import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { subscribeToNewsletter } from '@/lib/firebase-functions';

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await subscribeToNewsletter(email);

      setIsSubscribed(true);
      setEmail('');
      toast({
        title: "Success!",
        description: "Thank you for subscribing. Check your email for installation instructions.",
      });
    } catch (error: any) {
      console.error("Error subscribing to newsletter:", error);

      toast({
        title: "Subscription Failed",
        description: error.message || "Could not subscribe you at this time. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border-none shadow-lg px-2 sm:px-0">
      <CardContent className="p-6">
        {!isSubscribed ? (
          <>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Get Agentic Browser</h3>
            <p className="text-white/80 mb-4 text-xs sm:text-sm">
              Enter your email to receive installation instructions and get started with Agentic Browser.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex-grow bg-white/20 text-white placeholder:text-white/60 border-white/30"
                autoComplete="email"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="whitespace-nowrap w-full sm:w-auto"
              >
                {isLoading ? "Sending..." : "Get Started"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center p-4">
            <h3 className="font-medium text-white">Thank You!</h3>
            <p className="text-white/80 mt-2 text-sm">
              Check your email for instructions on how to install and use Agentic Browser.
            </p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent text-white border-white/30 hover:bg-white/20"
              onClick={() => setIsSubscribed(false)}
            >
              Subscribe Another Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsletterSignup;
