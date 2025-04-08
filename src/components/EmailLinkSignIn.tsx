import React, { useState } from 'react';
import { sendSignInLinkToUserEmail } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface EmailLinkSignInProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const EmailLinkSignIn: React.FC<EmailLinkSignInProps> = ({ isLoading, setIsLoading }) => {
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const { toast } = useToast();

  const handleSendLink = async (e: React.FormEvent) => {
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
      console.log("Sending sign-in link to:", email);
      await sendSignInLinkToUserEmail(email);
      
      setLinkSent(true);
      toast({
        title: "Email Sent",
        description: "Check your email for the sign-in link.",
      });
    } catch (error: any) {
      console.error("Error sending email link:", error);
      
      toast({
        title: "Failed to Send Email",
        description: error.message || "Could not send the sign-in link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!linkSent ? (
        <form onSubmit={handleSendLink} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email-link"
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
            {isLoading ? "Sending..." : "Send Sign-in Link"}
          </Button>
        </form>
      ) : (
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
          <h3 className="font-medium">Email Sent!</h3>
          <p className="text-sm mt-2">
            We've sent a sign-in link to <strong>{email}</strong>. 
            Check your email and click the link to sign in.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLinkSent(false)}
          >
            Use a different email
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmailLinkSignIn;
