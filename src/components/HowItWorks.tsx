
import React from 'react';
import { Download, Key, Rocket } from 'lucide-react';

const steps = [
  {
    icon: <Download className="w-10 h-10 text-agentic-purple" />,
    title: "Install Extension",
    description: "Add the Agentic Browser extension to Chrome from the Chrome Web Store in just a few clicks."
  },
  {
    icon: <Key className="w-10 h-10 text-agentic-blue" />,
    title: "Add Your API Keys",
    description: "Enter your API keys for OpenAI, Anthropic, Gemini, or DeepSeek. Keys are stored locally for privacy."
  },
  {
    icon: <Rocket className="w-10 h-10 text-agentic-purple" />,
    title: "Start Using AI",
    description: "Begin controlling your browser with natural language. Ask AI to complete tasks directly in your browser."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h6 className="text-agentic-purple font-medium mb-3">GETTING STARTED</h6>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Get up and running with Agentic Browser in three simple steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (only visible on desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-agentic-purple to-agentic-blue"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-agentic-purple/20 to-agentic-blue/20 flex items-center justify-center mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-white/70">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Ready to experience the power of AI-powered browsing? Install Agentic Browser today and revolutionize how you interact with the web.
          </p>
          <a 
            href="https://chrome.google.com/webstore/detail/agentic-browser-use/your-extension-id" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-agentic-purple to-agentic-blue hover:opacity-90 text-white px-8 py-3 rounded-md font-medium transition-all"
          >
            Install Extension
            <Download size={18} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
