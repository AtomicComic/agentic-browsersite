
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import UseCases from '@/components/UseCases';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-agentic-dark text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <UseCases />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
