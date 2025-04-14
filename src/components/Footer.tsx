
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Twitter } from 'lucide-react';
import Logo from '../assets/Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#f0f0f0] py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Logo className="w-8 h-8" />
            <span className="text-[#333333] font-medium">Agentic Browser</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/agenticbrowser" target="_blank" rel="noopener noreferrer" className="text-[#333333]/40 hover:text-[#66B3FF] transition-colors">
              <Instagram size={18} />
            </a>
            <a href="https://youtube.com/@agenticbrowser" target="_blank" rel="noopener noreferrer" className="text-[#333333]/40 hover:text-[#66B3FF] transition-colors">
              <Youtube size={18} />
            </a>
            <a href="https://x.com/agenticbrowser" target="_blank" rel="noopener noreferrer" className="text-[#333333]/40 hover:text-[#66B3FF] transition-colors">
              <Twitter size={18} />
            </a>
            <a href="https://www.threads.net/@agenticbrowser" target="_blank" rel="noopener noreferrer" className="text-[#333333]/40 hover:text-[#66B3FF] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="border-t border-[#f0f0f0] mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-[#333333]/40 text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji'] mb-2 md:mb-0">
            © {currentYear} Agentic Browser. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              to="/privacy-policy"
              className="text-[#333333]/60 hover:text-[#66B3FF] text-sm transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
