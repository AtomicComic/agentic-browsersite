
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const useCases = [
  {
    title: "Task Automation",
    description: "Automate form filling, data entry, and repetitive tasks with a simple command.",
    items: [
      "Automatic form completion",
      "Data extraction from websites",
      "Scheduled browser actions"
    ]
  },
  {
    title: "Content Summarization",
    description: "Get instant summaries of articles, research papers, or any webpage with one click.",
    items: [
      "Article condensation",
      "Research paper summaries",
      "Multi-page content digest"
    ]
  },
  {
    title: "Image Analysis",
    description: "Extract text from images, analyze visual content, and generate descriptions automatically.",
    items: [
      "OCR for screenshots",
      "Visual content interpretation",
      "Image-based search queries"
    ]
  },
  {
    title: "Research Assistant",
    description: "Research topics efficiently with AI finding and highlighting key information on websites.",
    items: [
      "Automated information gathering",
      "Cross-site data correlation",
      "Citation management"
    ]
  }
];

const UseCases = () => {
  return (
    <section id="use-cases" className="py-24 relative bg-[#0A0C14]">
      {/* Background matrix effect */}
      <div className="absolute inset-0 opacity-5 bg-[url('/matrix.svg')] bg-repeat"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h6 className="text-[#66B3FF] font-medium mb-3 uppercase tracking-widest text-sm font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">Applications</h6>
          <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight text-white font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">Popular Use Cases</h2>
          <p className="text-white/60 max-w-2xl mx-auto font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">
            Discover how Agentic Browser can enhance your productivity and transform your browsing experience.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div 
              key={index} 
              className="backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#66B3FF]/10 flex items-center justify-center text-[#66B3FF]">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-medium text-white font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">{useCase.title}</h3>
                </div>
                <p className="text-white/60 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">{useCase.description}</p>
              </div>
              <div className="p-6 bg-white/5">
                <ul className="space-y-3">
                  {useCase.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#66B3FF] mt-0.5 flex-shrink-0" />
                      <span className="text-white/80 font-['ui-sans-serif',system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
