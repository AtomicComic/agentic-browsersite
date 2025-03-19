
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';

const Hero = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // EmailJS configuration from environment variables
  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  useEffect(() => {
    // Initialize EmailJS with your public key
    emailjs.init(PUBLIC_KEY);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Send email using EmailJS
      const templateParams = {
        to_email: email,
        extension_link: 'https://chrome.google.com/webstore/detail/agentic-browser/jhdchfkgagokfbbhmomopcidkjnlieoc',
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
      
      console.log('Email successfully sent!');
      setIsSubmitted(true);
      setEmail('');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to send email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="pt-32 pb-20 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-hero-gradient opacity-50 -z-10"></div>
      
      {/* Abstract background decorations */}
      <div className="absolute top-20 -left-64 w-96 h-96 bg-agentic-purple/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 -right-64 w-96 h-96 bg-agentic-blue/20 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-gradient text-4xl md:text-5xl lg:text-6xl font-bold mb-6 mx-auto max-w-4xl leading-tight">
          AI-Powered Browser Control at Your Fingertips
        </h1>
        
        <p className="text-white/80 text-lg md:text-xl mb-8 mx-auto max-w-2xl">
          Use natural language to command AI models like GPT-4o, Claude, and Gemini
          to control your browser and accomplish any task - <span className="text-agentic-purple font-semibold">completely FREE</span>.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button 
            asChild
            size="lg" 
            className="bg-gradient-to-r from-agentic-purple to-agentic-blue hover:opacity-90 text-white px-8 py-6 text-lg"
          >
            <a href="https://chrome.google.com/webstore/detail/agentic-browser/jhdchfkgagokfbbhmomopcidkjnlieoc" target="_blank" rel="noopener noreferrer">
              Install Free Extension
            </a>
          </Button>
          
          <Button 
            asChild
            variant="outline" 
            size="lg" 
            className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg"
          >
            <a href="#how-it-works" className="flex items-center gap-2">
              How It Works <ArrowRight size={18} />
            </a>
          </Button>
        </div>

        <div className="max-w-md mx-auto mb-16">
          <p className="text-white/80 mb-4">
            Send me an email with the link to the extension for when I'm on my computer
          </p>
          
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
                disabled={isLoading || isSubmitted}
              />
            </div>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-agentic-purple to-agentic-blue hover:opacity-90 h-12"
              disabled={isLoading || isSubmitted}
            >
              {isLoading ? "Sending..." : isSubmitted ? "Sent!" : "Send Link"}
              <Send size={16} />
            </Button>
          </form>
          {error && (
            <p className="text-red-500 mt-2 text-sm">{error}</p>
          )}
        </div>
        
        {/* Hero Images/Mockups */}
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <div className="md:w-1/2 flex flex-col gap-6">
            <div className="relative glass-card p-4 rounded-xl animate-float">
              <img 
                src="/lovable-uploads/4613581d-8503-4a50-9d1c-c0e8a36bd5d8.png" 
                alt="Agentic Browser controlling Twitter timeline" 
                className="rounded-lg w-full shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 bg-agentic-purple text-white px-4 py-2 rounded-full text-sm font-medium">
                Automate Tasks
              </div>
            </div>
            
            <div className="relative glass-card p-4 rounded-xl animate-float" style={{animationDelay: "0.4s"}}>
              <img 
                src="/lovable-uploads/c63ca76e-2813-429a-93fe-c4b269f66e5d.png" 
                alt="Agentic Browser completing tasks" 
                className="rounded-lg w-full shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Task Completed!
              </div>
            </div>
          </div>
          
          <div className="relative md:w-1/2 glass-card p-4 rounded-xl animate-float h-full" style={{animationDelay: "0.2s"}}>
            <img 
              src="/lovable-uploads/5a194b26-9c70-4a61-8da9-e43fda38246e.png" 
              alt="Agentic Browser settings panel" 
              className="rounded-lg w-full h-full object-cover shadow-2xl"
            />
            <div className="absolute -top-4 -right-4 bg-agentic-blue text-white px-4 py-2 rounded-full text-sm font-medium">
              Simple Setup
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
