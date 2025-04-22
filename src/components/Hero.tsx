import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import landingPageBackground from '../assets/landingpage_background.mp4';
import NewsletterSignup from './NewsletterSignup';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <section className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden pt-16 md:pt-0">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <div className="relative w-full h-full video-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            loop
            className="object-cover w-full h-full"
          >
            <source src={landingPageBackground} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-6 sm:mb-10 text-white leading-[1.2] sm:leading-tight tracking-tight font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
            variants={itemVariants}
          >
            Agentic AI Automation Directly in Your Browser
          </motion.h1>

          <motion.p
            className="text-white/90 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
            variants={itemVariants}
          >
            Agentic browser transforms your workflow by enabling AI to autonomously control your browser and execute tasks effortlessly. Built for seamless productivity through intelligent automation, it empowers you to focus on what truly matters.
          </motion.p>

          {/* Newsletter Signup Form */}
          <motion.div
            className="mb-16"
            variants={itemVariants}
          >
            <NewsletterSignup />
          </motion.div>

          {/* Down arrow - with more vertical spacing and proper centering */}
          <motion.div
            className="mt-16 flex justify-center cursor-pointer"
            initial={{ y: 0 }}
            animate={{ y: [0, 12, 0] }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop"
            }}
            onClick={scrollToNextSection}
            variants={itemVariants}
          >
            <ChevronDown size={36} className="text-white/70 hover:text-white transition-colors" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
