
import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';
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
            <a href="#" className="text-[#333333]/40 hover:text-[#66B3FF] transition-colors">
              <Github size={18} />
            </a>
            <a href="#" className="text-[#333333]/40 hover:text-[#66B3FF] transition-colors">
              <Twitter size={18} />
            </a>
            <a href="#" className="text-[#333333]/40 hover:text-[#66B3FF] transition-colors">
              <Linkedin size={18} />
            </a>
          </div>
        </div>
        
        <div className="border-t border-[#f0f0f0] mt-6 pt-6 text-center md:text-left">
          <p className="text-[#333333]/40 text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">
            © {currentYear} Agentic Browser. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
