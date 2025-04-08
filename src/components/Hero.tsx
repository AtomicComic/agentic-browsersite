
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import landingPageBackground from '../assets/landingpage_background.mp4';

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
    <section className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
        >
          <source src={landingPageBackground} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center h-full text-center relative z-20">
        <motion.div
          className="max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-light mb-10 text-white leading-tight tracking-tight font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
            variants={itemVariants}
          >
            Pioneering the future of browser control
          </motion.h1>

          <motion.p
            className="text-white/90 text-xl max-w-2xl mx-auto mb-12 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
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
          <ChevronDown size={36} className="text-white/70 hover:text-white transition-colors" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
