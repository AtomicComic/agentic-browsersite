
import React from 'react';
import { 
  Cpu, 
  Globe, 
  Lock, 
  Rocket, 
  Code, 
  Cloud
} from 'lucide-react';

const features = [
  {
    icon: <Cpu className="feature-icon" />,
    title: "Multiple AI Models",
    description: "Works with GPT-4o, Claude, Gemini, DeepSeek, and more powerful vision-capable AI models."
  },
  {
    icon: <Globe className="feature-icon" />,
    title: "Browser Integration",
    description: "Control your browser directly with natural language commands without switching between apps."
  },
  {
    icon: <Lock className="feature-icon" />,
    title: "Privacy-First",
    description: "Your API keys stay local, and no data is stored on our servers - complete privacy guaranteed."
  },
  {
    icon: <Rocket className="feature-icon" />,
    title: "Automation",
    description: "Let AI handle repetitive tasks like filling forms, writing emails, and generating content."
  },
  {
    icon: <Code className="feature-icon" />,
    title: "Image Analysis",
    description: "Extract text from images, analyze screenshots, and generate captions effortlessly."
  },
  {
    icon: <Cloud className="feature-icon" />,
    title: "100% FREE",
    description: "Use your own API keys with no hidden fees, subscriptions, or usage limits."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h6 className="text-agentic-purple font-medium mb-3">CAPABILITIES</h6>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful AI Features</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Agentic Browser combines the latest AI technologies to transform how you interact with your browser.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="glass-card p-6 rounded-xl hover-glow"
            >
              {feature.icon}
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
