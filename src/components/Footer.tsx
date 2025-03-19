
import React from 'react';
import Logo from '../assets/Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-agentic-dark/80 border-t border-white/10 py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Logo className="w-6 h-6" />
            <span className="font-bold text-lg text-white">Agentic Browser</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#use-cases" className="text-white/70 hover:text-white transition-colors">Use Cases</a>
            <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">How It Works</a>
            <a 
              href="https://chrome.google.com/webstore/detail/agentic-browser/jhdchfkgagokfbbhmomopcidkjnlieoc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-agentic-purple hover:text-agentic-blue transition-colors"
            >
              Install Now
            </a>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm">
            © {currentYear} Agentic Browser. All rights reserved.
          </p>
          
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Terms of Service</a>
            <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
