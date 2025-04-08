import React, { useState, useEffect } from 'react';
import { Menu, X, Download } from 'lucide-react';
import Logo from '../assets/Logo';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0A0C14]/90 py-3 border-b border-gray-800' : 'bg-transparent py-5'
      }`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <span className={`font-normal text-xl tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
            isScrolled ? 'text-white' : 'text-white'
          }`}>AgenticBrowser</span>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 ml-8">
            <a href="#features" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
              isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
            }`}>Features</a>
            <a href="#use-cases" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
              isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
            }`}>Use Cases</a>
            <a href="#how-it-works" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
              isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
            }`}>Get Started</a>
          </nav>
        </div>        {/* Right side buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className={`text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
            isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'
          }`}>
            <a href="/login">Log in</a>
          </Button>
          <Button className={`bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-sm font-normal rounded-none font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
            isScrolled ? 'text-[#0A0C14]' : 'text-white'
          }`}>
            <a href="https://chromewebstore.google.com/detail/jhdchfkgagokfbbhmomopcidkjnlieoc?utm_source=item-share-cb" className="flex items-center gap-2">
              Add to Chrome <Download size={16} />
            </a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`md:hidden p-2 ${isScrolled ? 'text-white' : 'text-white'}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden backdrop-blur-xl absolute top-full left-0 right-0 border-b border-gray-800 shadow-lg bg-[#0A0C14]/90">
          <div className="flex flex-col space-y-4 p-4">
            <a 
              href="#features" 
              className="text-white/60 hover:text-white transition-colors px-4 py-2 text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#use-cases" 
              className="text-white/60 hover:text-white transition-colors px-4 py-2 text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Use Cases
            </a>
            <a 
              href="#how-it-works" 
              className="text-white/60 hover:text-white transition-colors px-4 py-2 text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Started
            </a>            <div className="flex flex-col gap-2 pt-2">
              <Button variant="ghost" className="justify-start text-white hover:bg-white/10 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">
                <a href="/login">Log in</a>
              </Button>
              <Button 
                className="justify-start bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-[#0A0C14] font-normal rounded-none font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
              >
                <a href="https://chromewebstore.google.com/detail/jhdchfkgagokfbbhmomopcidkjnlieoc?utm_source=item-share-cb" onClick={() => setIsMobileMenuOpen(false)}>
                  Add to Chrome
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
};

export default Navbar;
