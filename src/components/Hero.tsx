
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const scrollToNextSection = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center relative bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center h-full text-center">
        <motion.div 
          className="max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-6xl md:text-7xl lg:text-8xl font-light mb-10 text-[#333333] leading-tight tracking-tight font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
            variants={itemVariants}
          >
            Pioneering the future of browser control
          </motion.h1>
          
          <motion.p 
            className="text-[#333333]/70 text-xl max-w-2xl mx-auto mb-12 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
            variants={itemVariants}
          >
            At Agentic Browser, we see AI as the future of internet exploration — 
            built to accelerate workflow, anchored in security for everyone.
          </motion.p>
        </motion.div>
        
        {/* Down arrow */}
        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer"
          initial={{ y: 0 }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          onClick={scrollToNextSection}
        >
          <ChevronDown size={36} className="text-[#333333]/50 hover:text-[#333333] transition-colors" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
