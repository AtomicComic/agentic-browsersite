
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../assets/Logo';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-agentic-dark/80 backdrop-blur-md py-3 shadow-md' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-xl text-white">Agentic Browser</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
          <a href="#use-cases" className="text-white/80 hover:text-white transition-colors">Use Cases</a>
          <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</a>
          <Button asChild className="bg-gradient-to-r from-agentic-purple to-agentic-blue hover:opacity-90 text-white">
            <a href="https://chrome.google.com/webstore/detail/agentic-browser-use/your-extension-id" target="_blank" rel="noopener noreferrer">
              Install Now
            </a>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white p-2" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-agentic-dark/95 backdrop-blur-lg absolute top-full left-0 right-0 p-4 shadow-md">
          <div className="flex flex-col space-y-4">
            <a 
              href="#features" 
              className="text-white/80 hover:text-white transition-colors px-4 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#use-cases" 
              className="text-white/80 hover:text-white transition-colors px-4 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Use Cases
            </a>
            <a 
              href="#how-it-works" 
              className="text-white/80 hover:text-white transition-colors px-4 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <Button 
              asChild 
              className="w-full bg-gradient-to-r from-agentic-purple to-agentic-blue hover:opacity-90 text-white"
            >
              <a 
                href="https://chrome.google.com/webstore/detail/agentic-browser-use/your-extension-id" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Install Now
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
