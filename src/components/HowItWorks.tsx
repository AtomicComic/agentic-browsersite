
import React from 'react';
import { Download, Key, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: <Download className="w-10 h-10 text-[#66B3FF]" />,
    title: "Install Extension",
    description: "Add the Agentic Browser extension to Chrome from the Chrome Web Store in just a few clicks."
  },
  {
    icon: <Key className="w-10 h-10 text-[#66B3FF]" />,
    title: "Add Your API Keys",
    description: "Enter your API keys for OpenAI, Anthropic, Gemini, or DeepSeek. Keys are stored locally for privacy."
  },
  {
    icon: <Rocket className="w-10 h-10 text-[#66B3FF]" />,
    title: "Start Using AI",
    description: "Begin controlling your browser with natural language. Ask AI to complete tasks directly in your browser."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative bg-white">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h6 className="text-[#66B3FF] font-medium mb-3 uppercase tracking-widest text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">Getting Started</h6>
          <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight text-[#333333] font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">How It Works</h2>
          <p className="text-[#333333]/70 max-w-2xl mx-auto font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">
            Get up and running with Agentic Browser in three simple steps.
          </p>
        </motion.div>
        
        <div className="relative">
          {/* Connector line (only visible on desktop) */}
          <div className="hidden md:block absolute top-24 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5">
            <div className="h-full bg-gradient-to-r from-[#66B3FF] via-[#66B3FF]/70 to-[#66B3FF]"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                className="flex flex-col items-center text-center relative z-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="w-16 h-16 rounded-full bg-[#f0f0f0] flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <div className="w-10 h-10 rounded-full bg-white border-4 border-[#f0f0f0] absolute top-3 z-20 flex items-center justify-center text-[#333333] font-medium">
                  {index + 1}
                </div>
                <h3 className="text-xl font-medium mb-3 text-[#333333] font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">{step.title}</h3>
                <p className="text-[#333333]/70 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
        
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[#333333]/70 mb-8 max-w-2xl mx-auto font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">
            Ready to experience the power of AI-powered browsing? Install the free Agentic Browser extension today and revolutionize how you interact with the web.
          </p>
          <Button 
            asChild
            className="bg-[#66B3FF] hover:bg-[#66B3FF]/90 text-[#333333] px-8 py-6 text-lg rounded-none"
          >
            <a 
              href="https://chrome.google.com/webstore/detail/agentic-browser-use/your-extension-id" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']"
            >
              Add to Chrome
              <Download size={18} />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
