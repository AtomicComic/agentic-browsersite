
import React from 'react';
import { 
  Cpu, 
  Globe, 
  Lock, 
  Rocket, 
  Code, 
  Cloud
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Cpu className="w-8 h-8 text-[#66B3FF]" />,
    title: "Multiple AI Models",
    description: "Works with GPT-4o, Claude, Gemini, DeepSeek, and more powerful vision-capable AI models."
  },
  {
    icon: <Globe className="w-8 h-8 text-[#66B3FF]" />,
    title: "Browser Integration",
    description: "Control your browser directly with natural language commands without switching between apps."
  },
  {
    icon: <Lock className="w-8 h-8 text-[#66B3FF]" />,
    title: "Privacy-First",
    description: "Your API keys stay local, and no data is stored on our servers - complete privacy guaranteed."
  },
  {
    icon: <Rocket className="w-8 h-8 text-[#66B3FF]" />,
    title: "Automation",
    description: "Let AI handle repetitive tasks like filling forms, writing emails, and generating content."
  },
  {
    icon: <Code className="w-8 h-8 text-[#66B3FF]" />,
    title: "Image Analysis",
    description: "Extract text from images, analyze screenshots, and generate captions effortlessly."
  },
  {
    icon: <Cloud className="w-8 h-8 text-[#66B3FF]" />,
    title: "100% FREE",
    description: "Use your own API keys with no hidden fees, subscriptions, or usage limits."
  }
];

const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  return (
    <section id="features" className="py-24 relative bg-[#0A0C14]">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h6 className="text-[#66B3FF] font-medium mb-3 uppercase tracking-widest text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">Capabilities</h6>
          <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight text-white font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">Powerful AI Features</h2>
          <p className="text-white/60 max-w-2xl mx-auto font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">
            Agentic Browser combines the latest AI technologies to transform how you interact with your browser.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="backdrop-blur-md bg-white/5 border border-white/10 p-6 hover:border-[#66B3FF]/30 transition-all duration-300"
              variants={itemVariants}
            >
              <div className="mb-4 p-3 inline-block bg-white/5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium mb-3 text-white font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">{feature.title}</h3>
              <p className="text-white/60 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
