import React, { useState, useEffect } from 'react';
import { Menu, X, Download, LogOut } from 'lucide-react';
import Logo from '../assets/Logo';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { logoutUser } from '@/lib/firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // Check if we're on the homepage
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive"
      });
    }
  };

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
          <Link to="/" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className={`font-normal text-xl tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
              isScrolled ? 'text-white' : 'text-white'
            }`}>AgenticBrowser</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 ml-8">
            {isHomePage ? (
              <>
                <a href="#features" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
                }`}>Features</a>
                <a href="#use-cases" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
                }`}>Use Cases</a>
                <a href="#how-it-works" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
                }`}>Get Started</a>
              </>
            ) : (
              <>
                <Link to="/" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
                }`}>Features</Link>
                <Link to="/" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
                }`}>Use Cases</Link>
                <Link to="/" className={`transition-colors text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white/60 hover:text-white' : 'text-white/80 hover:text-white'
                }`}>Get Started</Link>
              </>
            )}
          </nav>
        </div>        {/* Right side buttons */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser ? (
            <>
              <Button
                variant="ghost"
                className={`text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'
                }`}
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                className={`text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                  isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'
                }`}
                onClick={handleLogout}
              >
                <span className="flex items-center gap-2">Log out <LogOut size={16} /></span>
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className={`text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] ${
                isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'
              }`}
            >
              <Link to="/login">Log in</Link>
            </Button>
          )}
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
            {isHomePage ? (
              <>
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
                </a>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="text-white/60 hover:text-white transition-colors px-4 py-2 text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/"
                  className="text-white/60 hover:text-white transition-colors px-4 py-2 text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Use Cases
                </Link>
                <Link
                  to="/"
                  className="text-white/60 hover:text-white transition-colors px-4 py-2 text-sm uppercase tracking-wide font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}            <div className="flex flex-col gap-2 pt-2">
              {currentUser ? (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start text-white hover:bg-white/10 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-white hover:bg-white/10 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-2">Log out <LogOut size={16} /></span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="justify-start text-white hover:bg-white/10 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/login">Log in</Link>
                </Button>
              )}
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
