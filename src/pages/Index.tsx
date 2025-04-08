
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import UseCases from '@/components/UseCases';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';
import BinaryIntro from '@/components/BinaryIntro';

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const handleAnimationComplete = () => {
    setShowContent(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0A0C14] text-white overflow-x-hidden">
      {showIntro && <BinaryIntro onAnimationComplete={handleAnimationComplete} />}
      
      {showContent && (
        <>
          <Navbar />
          <Hero />
          <Features />
          <UseCases />
          <HowItWorks />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
